const { GoogleGenAI, Type } = require("@google/genai");
const Invoice = require("../models/Invoice");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// Simple in-memory cache for dashboard insights so we don't call Gemini on
// every dashboard load. Keyed by user; busted when their invoice data changes
// (signature) or after the TTL expires.
const INSIGHTS_TTL_MS = 10 * 60 * 1000; // 10 minutes
const insightsCache = new Map(); // userId -> { signature, insights, expiresAt }

// Response schemas for structured (JSON) generation.
const invoiceExtractSchema = {
  type: Type.OBJECT,
  properties: {
    clientName: { type: Type.STRING },
    email: { type: Type.STRING },
    address: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
        },
        required: ["name", "quantity", "unitPrice"],
      },
    },
  },
  required: ["clientName", "items"],
};

const insightsSchema = {
  type: Type.OBJECT,
  properties: {
    insights: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["insights"],
};

// Parse JSON from a model response. With responseMimeType=application/json the
// text is already clean JSON, but we strip fences defensively and fail clearly.
const parseJsonResponse = (text) => {
  if (typeof text !== "string") {
    throw new ApiError(502, "Could not extract text from AI response");
  }
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new ApiError(502, "AI returned a malformed response. Please retry.");
  }
};

// @desc    Parse free text into invoice fields
// @route   POST /api/ai/parse-text
// @access  Private
const parseInvoiceFromText = asyncHandler(async (req, res) => {
  const { text } = req.body;

  const prompt = `You are an expert invoice data extraction AI. Analyze the following text and extract the information needed to create an invoice.

    --- TEXT START ---
    ${text}
    --- TEXT END ---

    Extract the client details and line items. If a value is not present, omit it.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: invoiceExtractSchema,
    },
  });

  res.status(200).json(parseJsonResponse(response.text));
});

// @desc    Extract invoice fields from a receipt/bill image
// @route   POST /api/ai/parse-receipt
// @access  Private
const parseReceiptFromImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "An image file is required");
  }

  const prompt = `You are an expert at reading receipts and bills. Extract the
    vendor/client name and the purchased line items (name, quantity, unit price)
    from this image to create an invoice. If a value is not present, omit it.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64"),
        },
      },
      { text: prompt },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: invoiceExtractSchema,
    },
  });

  res.status(200).json(parseJsonResponse(response.text));
});

// @desc    Generate a reminder email for an invoice
// @route   POST /api/ai/generate-reminder
// @access  Private
const generateReminderEmail = asyncHandler(async (req, res) => {
  const { invoiceId } = req.body;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.user.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized");
  }

  const amountDue = Math.max(
    0,
    Number(invoice.total || 0) - Number(invoice.amountPaid || 0)
  );
  const amountDueFormatted = `₹${amountDue.toFixed(2)}`;
  const dueDateFormatted = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString()
    : "N/A";

  const prompt = `
      You are a professional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment.

      Use the following details to personalize the email:
      - Client Name: ${invoice.billTo?.clientName || "Valued Client"}
      - Invoice Number: ${invoice.invoiceNumber}
      - Amount Due (Indian Rupee): ${amountDueFormatted}
      - Due Date: ${dueDateFormatted}

      The tone should be friendly but clear. **Crucially, when mentioning the money, always use the Indian Rupee format you were given (e.g., ₹5,000.00).** Keep it concise. Start the email with "Subject:".
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  res.status(200).json({ reminderText: response.text });
});

// @desc    Generate dashboard insights from the user's invoices
// @route   GET /api/ai/dashboard-summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  // Insights are about invoices only — not estimates, proforma, notes, etc.
  const invoices = await Invoice.find({ user: req.user.id, type: "invoice" });

  if (invoices.length === 0) {
    return res.status(200).json({
      insights: ["No invoice data available to generate insights."],
    });
  }

  const num = (v) => Number(v) || 0;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
  // Anything issued and not fully settled/cancelled is still owed.
  const unpaidInvoices = invoices.filter((inv) =>
    ["Unpaid", "Sent"].includes(inv.status)
  );
  // Revenue = cash actually received across all invoices (incl. partial).
  const totalRevenue = invoices.reduce(
    (acc, inv) =>
      acc + (inv.status === "Paid" ? num(inv.total) : num(inv.amountPaid)),
    0
  );
  const totalOutstanding = invoices.reduce(
    (acc, inv) =>
      acc +
      (["Unpaid", "Sent"].includes(inv.status)
        ? num(inv.total) - num(inv.amountPaid)
        : 0),
    0
  );

  // Serve cached insights if the user's data is unchanged and within the TTL.
  const signature = `${totalInvoices}:${totalRevenue}:${totalOutstanding}`;
  const cached = insightsCache.get(req.user.id);
  if (cached && cached.signature === signature && cached.expiresAt > Date.now()) {
    return res.status(200).json({ insights: cached.insights });
  }

  const dataSummary = `
      - Total number of invoices: ${totalInvoices}
      - Total paid invoices: ${paidInvoices.length}
      - Total unpaid/pending invoices: ${unpaidInvoices.length}
      - Total revenue from paid invoices: ${totalRevenue.toFixed(2)}
      - Total outstanding amount from unpaid/pending invoices: ${totalOutstanding.toFixed(
        2
      )}
      - Recent invoices (last 5): ${invoices
        .slice(0, 5)
        .map(
          (inv) =>
            `Invoice #${inv.invoiceNumber} for ${num(inv.total).toFixed(
              2
            )} with status ${inv.status}`
        )
        .join(", ")}
    `;

  const prompt = `
      You are a friendly and insightful financial analyst for a small business owner.
      Based on the following summary of their invoice data, provide 2-3 concise and actionable insights.
      Each insight should be a short string.
      The insights should be encouraging and helpful, and use the Indian Rupee symbol (₹) when referring to amounts.
      Do not use the dollar ($) symbol anywhere. Do not just repeat the data.
      For example, if there is a high outstanding amount, suggest sending reminders. If revenue is high, be encouraging.

      Data Summary:
      ${dataSummary}
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: insightsSchema,
    },
  });

  const parsedData = parseJsonResponse(response.text);

  // Cache the generated insights for this user/data signature.
  if (Array.isArray(parsedData.insights)) {
    insightsCache.set(req.user.id, {
      signature,
      insights: parsedData.insights,
      expiresAt: Date.now() + INSIGHTS_TTL_MS,
    });
  }

  res.status(200).json(parsedData);
});

module.exports = {
  parseInvoiceFromText,
  parseReceiptFromImage,
  generateReminderEmail,
  getDashboardSummary,
};
