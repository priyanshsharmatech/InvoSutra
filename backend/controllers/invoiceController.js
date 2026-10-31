const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendMail } = require("../utils/email");
const { buildInvoiceEmailHtml } = require("../utils/invoiceEmailTemplate");
const { renderInvoicePdf } = require("../utils/invoicePdf");
const { uploadFile, deleteFile } = require("../utils/cloudinary");
const {
  round2,
  computeTotals,
  computeDiscount,
  computeNextNumber,
  formatNumber,
  prefixFor,
  DOCUMENT_TYPES,
} = require("../utils/invoiceMath");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Save a new billed-to client to the user's client list when it isn't already
// there (matched by name, case-insensitive). Best-effort — never blocks saving.
const autoSaveClient = async (userId, billTo) => {
  try {
    const name = (billTo?.clientName || "").trim();
    if (!name) return;
    const exists = await Client.findOne({
      user: userId,
      deleted: { $ne: true },
      clientName: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
    if (exists) return;
    await Client.create({
      user: userId,
      clientName: name,
      email: billTo.email || "",
      address: billTo.address || "",
      phone: billTo.phone || "",
      gstin: billTo.gstin || "",
      state: billTo.state || "",
    });
  } catch (err) {
    console.error("Auto-save client failed:", err.message);
  }
};

// Fetch an invoice and ensure it belongs to the requesting user.
const getOwnedInvoice = async (id, userId) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.user.toString() !== userId) {
    throw new ApiError(403, "Not authorized");
  }
  return invoice;
};

// Build the full document payload (totals, GST split, number) for a create.
const buildDocument = async (req, body, type) => {
  const {
    invoiceDate,
    dueDate,
    billFrom,
    billTo,
    items,
    notes,
    paymentTerms,
    theme,
    status,
    discount,
    relatedInvoice,
  } = body;

  const { items: itemsWithTotals, subTotal, taxTotal } = computeTotals(items);
  const discountTotal = computeDiscount(subTotal, discount);
  const additionalCharges = round2(Math.max(Number(body.additionalCharges) || 0, 0));
  const total = round2(
    Math.max(subTotal + taxTotal - discountTotal + additionalCharges, 0)
  );
  const isInterState = Boolean(
    billFrom?.state && billTo?.state && billFrom.state !== billTo.state
  );

  const prefix = prefixFor(type, req.user.invoicePrefix, req.user.docPrefixes);
  let next = await computeNextNumber(req.user._id, type);

  // A duplicate keeps the source's number (suffixed) so it's obvious which
  // document it copies, rather than getting an unrelated new number.
  const copyOf = body.isDuplicate ? body.invoiceNumber : null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const invoiceNumber = copyOf
      ? attempt === 0
        ? `${copyOf} (Copy)`
        : `${copyOf} (Copy ${attempt + 1})`
      : formatNumber(prefix, next);
    try {
      return await Invoice.create({
        user: req.user._id,
        type,
        relatedInvoice: relatedInvoice || undefined,
        invoiceNumber,
        invoiceDate,
        dueDate,
        billFrom,
        billTo,
        items: itemsWithTotals,
        notes,
        paymentTerms,
        theme: theme || req.user.invoiceTheme || "classic",
        status: status || "Unpaid",
        discount: discount || { type: "flat", value: 0 },
        subTotal,
        taxTotal,
        discountTotal,
        additionalCharges,
        isDuplicate: Boolean(body.isDuplicate),
        isInterState,
        total,
      });
    } catch (err) {
      if (err.code === 11000 && attempt < 4) {
        next += 1;
        continue;
      }
      throw err;
    }
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = asyncHandler(async (req, res) => {
  const { invoiceDate, dueDate } = req.body;
  const type = DOCUMENT_TYPES.includes(req.body.type)
    ? req.body.type
    : "invoice";

  if (invoiceDate && dueDate && new Date(dueDate) < new Date(invoiceDate)) {
    throw new ApiError(400, "The due date must be on or after the invoice date.");
  }

  const invoice = await buildDocument(req, req.body, type);
  // Remember a newly-entered client for next time.
  await autoSaveClient(req.user._id, req.body.billTo);
  res.status(201).json(invoice);
});

// @desc    Duplicate an existing invoice into a new draft
// @route   POST /api/invoices/:id/duplicate
// @access  Private
exports.duplicateInvoice = asyncHandler(async (req, res) => {
  const src = await getOwnedInvoice(req.params.id, req.user.id);
  const body = {
    ...src.toObject(),
    invoiceDate: new Date(),
    status: "Draft",
    payments: [],
    amountPaid: 0,
    isDuplicate: true,
    relatedInvoice: src._id,
  };
  const copy = await buildDocument(req, body, src.type || "invoice");
  res.status(201).json(copy);
});

// @desc    Convert an estimate or proforma into an invoice (creates a new one)
// @route   POST /api/invoices/:id/convert
// @access  Private
exports.convertEstimate = asyncHandler(async (req, res) => {
  const src = await getOwnedInvoice(req.params.id, req.user.id);
  if (!["estimate", "proforma"].includes(src.type)) {
    throw new ApiError(
      400,
      "Only quotations or proforma invoices can be converted to invoices."
    );
  }
  const body = {
    ...src.toObject(),
    invoiceDate: new Date(),
    status: "Unpaid",
    isDuplicate: false,
  };
  const invoice = await buildDocument(req, body, "invoice");
  // Mark the source as converted (keep it, link it).
  src.relatedInvoice = invoice._id;
  await src.save();
  res.status(201).json(invoice);
});

// Factory: create a new document (credit note / debit note / receipt) derived
// from an existing invoice. A receipt records money received, so it starts
// settled; notes start as drafts for review.
const createDerived = (type, label) =>
  asyncHandler(async (req, res) => {
    const src = await getOwnedInvoice(req.params.id, req.user.id);
    const amount = Number(req.body?.amount);
    const reason = (req.body?.reason || "").toString().trim();
    const body = {
      ...src.toObject(),
      invoiceDate: new Date(),
      status: type === "receipt" ? "Paid" : "Draft",
      payments: [],
      amountPaid: 0,
      isDuplicate: false,
      relatedInvoice: src._id,
      notes:
        req.body?.notes ||
        reason ||
        `${label} for ${src.invoiceNumber}`,
    };
    // Partial note/receipt: one adjustment line for the given amount instead of
    // copying every line item from the source invoice.
    if (amount > 0) {
      body.items = [
        { name: reason || label, hsn: "", quantity: 1, unitPrice: amount, taxPercent: 0 },
      ];
      body.discount = { type: "flat", value: 0 };
    }
    const doc = await buildDocument(req, body, type);
    res.status(201).json(doc);
  });

// @desc    Create a credit note / debit note / receipt against an invoice
// @route   POST /api/invoices/:id/credit-note | /debit-note | /receipt
// @access  Private
exports.createCreditNote = createDerived("creditnote", "Credit note");
exports.createDebitNote = createDerived("debitnote", "Debit note");
exports.createReceipt = createDerived("receipt", "Receipt");

// @desc    Suggested next number for the create form (per type)
// @route   GET /api/invoices/next-number
// @access  Private
exports.getNextInvoiceNumber = asyncHandler(async (req, res) => {
  const type = DOCUMENT_TYPES.includes(req.query.type)
    ? req.query.type
    : "invoice";
  const next = await computeNextNumber(req.user._id, type);
  res.json({
    invoiceNumber: formatNumber(
      prefixFor(type, req.user.invoicePrefix, req.user.docPrefixes),
      next
    ),
  });
});

// @desc    Distinct past clients (for autofill in the create form)
// @route   GET /api/invoices/clients
// @access  Private
exports.getClients = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ user: req.user.id })
    .select("billTo -_id")
    .sort({ createdAt: -1 });

  const seen = new Set();
  const clients = [];
  for (const inv of invoices) {
    const b = inv.billTo;
    if (!b?.clientName) continue;
    const key = `${b.clientName}|${b.email || ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clients.push({
      clientName: b.clientName,
      email: b.email || "",
      address: b.address || "",
      phone: b.phone || "",
    });
    if (clients.length >= 100) break;
  }
  res.json({ data: clients });
});

// @desc    Get invoices of logged-in user (paginated, filterable, searchable)
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = asyncHandler(async (req, res) => {
  const { page, limit, status, search, type } = req.query;

  const filter = {
    user: req.user.id,
    type: type || "invoice",
    deleted: { $ne: true },
  };
  // "Overdue" and "Partially Paid" are derived states, not stored on the
  // document, so translate them into concrete query conditions.
  if (status === "Overdue") {
    filter.status = { $in: ["Unpaid", "Sent"] };
    filter.dueDate = { $lt: new Date() };
  } else if (status === "Partially Paid") {
    filter.status = { $in: ["Unpaid", "Sent"] };
    filter.amountPaid = { $gt: 0 };
    filter.$expr = { $lt: ["$amountPaid", "$total"] };
  } else if (status) {
    filter.status = status;
  }
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { invoiceNumber: regex },
      { "billTo.clientName": regex },
      { "billTo.email": regex },
    ];
  }

  const skip = (page - 1) * limit;

  const [invoices, totalCount] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email"),
    Invoice.countDocuments(filter),
  ]);

  res.json({
    data: invoices,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("user", "name email brandLogo signature stamp")
    .populate("relatedInvoice", "invoiceNumber type");
  if (!invoice) throw new ApiError(404, "Invoice not found");

  if (invoice.user._id.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized");
  }

  // Documents that were derived FROM this one (reverse link), e.g. an invoice's
  // credit notes, or the invoice created from this estimate.
  const relatedDocs = await Invoice.find({
    user: req.user.id,
    relatedInvoice: invoice._id,
    deleted: { $ne: true },
  }).select("invoiceNumber type");

  res.json({ ...invoice.toObject(), relatedDocs });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = asyncHandler(async (req, res) => {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    billFrom,
    billTo,
    items,
    notes,
    paymentTerms,
    status,
    theme,
    discount,
    additionalCharges,
  } = req.body;

  const existingInvoice = await Invoice.findById(req.params.id);
  if (!existingInvoice) throw new ApiError(404, "Invoice not found!");
  if (existingInvoice.user.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized");
  }

  // Validate the due date against the effective invoice date.
  const effectiveInvoiceDate = invoiceDate ?? existingInvoice.invoiceDate;
  const effectiveDueDate = dueDate ?? existingInvoice.dueDate;
  if (
    effectiveInvoiceDate &&
    effectiveDueDate &&
    new Date(effectiveDueDate) < new Date(effectiveInvoiceDate)
  ) {
    throw new ApiError(400, "The due date must be on or after the invoice date.");
  }

  // Only update fields that were actually provided.
  const updates = {};
  if (invoiceNumber !== undefined) updates.invoiceNumber = invoiceNumber;
  if (invoiceDate !== undefined) updates.invoiceDate = invoiceDate;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (billFrom !== undefined) updates.billFrom = billFrom;
  if (billTo !== undefined) updates.billTo = billTo;
  if (notes !== undefined) updates.notes = notes;
  if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms;
  if (status !== undefined) updates.status = status;
  if (theme !== undefined) updates.theme = theme;
  if (discount !== undefined) updates.discount = discount;

  // Recompute GST place-of-supply when either party changes.
  if (billFrom !== undefined || billTo !== undefined) {
    const bf = billFrom ?? existingInvoice.billFrom;
    const bt = billTo ?? existingInvoice.billTo;
    updates.isInterState = Boolean(
      bf?.state && bt?.state && bf.state !== bt.state
    );
  }

  // Recalculate totals when items or discount change (discount can change
  // independently, so fall back to the existing items/discount as needed).
  if (
    items !== undefined ||
    discount !== undefined ||
    additionalCharges !== undefined
  ) {
    const effectiveItems = items ?? existingInvoice.items;
    const effectiveDiscount = discount ?? existingInvoice.discount;
    const effectiveAdditional = round2(
      Math.max(Number(additionalCharges ?? existingInvoice.additionalCharges) || 0, 0)
    );
    const { items: itemsWithTotals, subTotal, taxTotal } =
      computeTotals(effectiveItems);
    const discountTotal = computeDiscount(subTotal, effectiveDiscount);
    if (items !== undefined) updates.items = itemsWithTotals;
    if (additionalCharges !== undefined)
      updates.additionalCharges = effectiveAdditional;
    updates.subTotal = subTotal;
    updates.taxTotal = taxTotal;
    updates.discountTotal = discountTotal;
    updates.total = round2(
      Math.max(subTotal + taxTotal - discountTotal + effectiveAdditional, 0)
    );
  }

  const updatedInvoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json(updatedInvoice);
});

// @desc    Move an invoice to Trash (soft delete)
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  invoice.deleted = true;
  invoice.deletedAt = new Date();
  await invoice.save();
  res.json({ message: "Invoice moved to Trash." });
});

// @desc    Generate a PDF of the invoice on the server (Puppeteer)
// @route   GET /api/invoices/:id/pdf
// @access  Private
exports.downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  const pdf = await renderInvoicePdf(invoice.toObject(), req.user);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${invoice.invoiceNumber}.pdf"`
  );
  res.send(pdf);
});

// @desc    List soft-deleted invoices (Trash)
// @route   GET /api/invoices/trash
// @access  Private
exports.getTrash = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ user: req.user.id, deleted: true })
    .sort({ deletedAt: -1 })
    .limit(200);
  res.json({ data: invoices });
});

// @desc    Restore an invoice from Trash
// @route   POST /api/invoices/:id/restore
// @access  Private
exports.restoreInvoice = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  invoice.deleted = false;
  invoice.deletedAt = undefined;
  await invoice.save();
  res.json({ message: "Invoice restored.", invoice });
});

// @desc    Permanently delete an invoice
// @route   DELETE /api/invoices/:id/permanent
// @access  Private
exports.purgeInvoice = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  await invoice.deleteOne();
  res.json({ message: "Invoice permanently deleted." });
});

// Recompute amountPaid and auto-settle status when fully paid.
const applyPaymentState = (invoice) => {
  invoice.amountPaid = (invoice.payments || []).reduce(
    (s, p) => s + (p.amount || 0),
    0
  );
  // Draft and Cancelled are deliberate manual states — payments never flip them.
  if (invoice.status === "Draft" || invoice.status === "Cancelled") return;
  if (invoice.amountPaid >= (invoice.total || 0) && invoice.total > 0) {
    invoice.status = "Paid";
  } else if (invoice.status === "Paid") {
    // Payment removed below the total — reopen it.
    invoice.status = "Unpaid";
  }
};

// @desc    Bulk mark paid/unpaid or delete invoices
// @route   POST /api/invoices/bulk
// @access  Private
exports.bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  const filter = { _id: { $in: ids }, user: req.user.id };

  if (action === "delete") {
    // Soft delete — move to Trash rather than destroying.
    const r = await Invoice.updateMany(filter, {
      deleted: true,
      deletedAt: new Date(),
    });
    return res.json({
      message: `Moved ${r.modifiedCount} to Trash`,
      count: r.modifiedCount,
    });
  }
  const status = action === "markPaid" ? "Paid" : "Unpaid";
  const r = await Invoice.updateMany(filter, { status });
  res.json({ message: `Updated ${r.modifiedCount}`, count: r.modifiedCount });
});

// @desc    Record a payment against an invoice
// @route   POST /api/invoices/:id/payments
// @access  Private
exports.addPayment = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  const { amount, method, note, date } = req.body;

  invoice.payments.push({
    amount,
    method: method || "",
    note: note || "",
    date: date || new Date(),
  });
  applyPaymentState(invoice);
  await invoice.save();

  res.status(201).json(invoice);
});

// @desc    Remove a recorded payment
// @route   DELETE /api/invoices/:id/payments/:paymentId
// @access  Private
exports.deletePayment = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  const payment = invoice.payments.id(req.params.paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  payment.deleteOne();
  applyPaymentState(invoice);
  await invoice.save();

  res.json(invoice);
});

// @desc    Attach a supporting file to an invoice
// @route   POST /api/invoices/:id/attachments  (multipart: "file")
// @access  Private
exports.addAttachment = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  if (!req.file) throw new ApiError(400, "A file is required");

  const uploaded = await uploadFile(
    req.file.buffer,
    `invosutra/attachments/${req.user.id}`,
    req.file.originalname
  );
  invoice.attachments.push({
    name: req.file.originalname,
    url: uploaded.url,
    publicId: uploaded.publicId,
    resourceType: uploaded.resourceType,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
  await invoice.save();
  res.status(201).json(invoice);
});

// @desc    Remove an attachment from an invoice
// @route   DELETE /api/invoices/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);
  const att = invoice.attachments.id(req.params.attachmentId);
  if (!att) throw new ApiError(404, "Attachment not found");

  await deleteFile(att.publicId, att.resourceType);
  att.deleteOne();
  await invoice.save();
  res.json(invoice);
});

// @desc    Email the invoice to the client
// @route   POST /api/invoices/:id/send
// @access  Private
exports.sendInvoiceEmail = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);

  const to = invoice.billTo?.email;
  if (!to) {
    throw new ApiError(400, "This invoice has no client email address");
  }

  // Prefer a client-supplied PDF; otherwise render one on the server so the
  // email always carries an attachment (e.g. from bulk send).
  let attachments;
  if (req.file) {
    attachments = [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: req.file.buffer,
        contentType: "application/pdf",
      },
    ];
  } else {
    try {
      const pdf = await renderInvoicePdf(invoice.toObject(), req.user);
      attachments = [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ];
    } catch (err) {
      console.error("Server PDF attach failed:", err.message);
    }
  }

  await sendMail({
    to,
    subject: `Invoice ${invoice.invoiceNumber} from ${
      invoice.billFrom?.businessName || req.user.name
    }`,
    html: buildInvoiceEmailHtml(invoice),
    attachments,
  });

  // Record delivery and advance an un-sent invoice to "Sent".
  invoice.lastSentAt = new Date();
  if (["Draft", "Unpaid"].includes(invoice.status)) invoice.status = "Sent";
  await invoice.save();

  res.json({
    message: `Invoice sent to ${to}`,
    status: invoice.status,
    lastSentAt: invoice.lastSentAt,
  });
});

// @desc    Email a (usually AI-generated) reminder to the client
// @route   POST /api/invoices/:id/send-reminder
// @access  Private
exports.sendReminderEmail = asyncHandler(async (req, res) => {
  const invoice = await getOwnedInvoice(req.params.id, req.user.id);

  const to = invoice.billTo?.email;
  if (!to) {
    throw new ApiError(400, "This invoice has no client email address");
  }

  const { subject, message } = req.body;

  await sendMail({
    to,
    subject: subject || `Payment reminder: Invoice ${invoice.invoiceNumber}`,
    text: message,
  });

  res.json({ message: `Reminder sent to ${to}` });
});
