const { z } = require("zod");
const { DOCUMENT_TYPES } = require("../utils/invoiceMath");

// Stored, settable statuses. "Partially Paid" and "Overdue" are derived on the
// client and are only accepted as list filters, not as values to persist.
const storedStatus = z.enum(["Draft", "Sent", "Unpaid", "Paid", "Cancelled"]);
const filterStatus = z.enum([
  "Draft",
  "Sent",
  "Unpaid",
  "Paid",
  "Cancelled",
  "Partially Paid",
  "Overdue",
]);

const partySchema = z.object({
  businessName: z.string().trim().max(200).optional(),
  clientName: z.string().trim().max(200).optional(),
  email: z.email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  gstin: z.string().trim().max(20).optional(),
  state: z.string().trim().max(60).optional(),
});

const itemSchema = z.object({
  name: z.string().trim().min(1, "Enter a name for this item."),
  hsn: z.string().trim().max(12).optional(),
  quantity: z.coerce.number().positive("Enter a quantity greater than 0."),
  unitPrice: z.coerce.number().nonnegative("Enter a price of 0 or more."),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
  discount: z
    .object({
      type: z.enum(["flat", "percent"]).optional(),
      value: z.coerce.number().min(0).optional(),
    })
    .optional(),
});

const docType = z.enum(DOCUMENT_TYPES).optional();

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const discountSchema = z
  .object({
    type: z.enum(["flat", "percent"]).optional(),
    value: z.coerce.number().min(0).optional(),
  })
  .optional();

const createInvoiceSchema = z.object({
  // Assigned server-side for per-user uniqueness; ignored if the client sends one.
  invoiceNumber: z.string().trim().optional(),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  billFrom: partySchema.optional(),
  billTo: partySchema.optional(),
  items: z.array(itemSchema).min(1, "Please add at least one item before saving."),
  notes: z.string().max(2000).optional(),
  paymentTerms: z.string().trim().max(100).optional(),
  theme: z.enum(["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"]).optional(),
  status: storedStatus.optional(),
  discount: discountSchema,
  additionalCharges: z.coerce.number().min(0).optional(),
  type: docType,
});

// All fields optional for partial updates; status is editable here.
const updateInvoiceSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1).optional(),
    invoiceDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    billFrom: partySchema.optional(),
    billTo: partySchema.optional(),
    items: z.array(itemSchema).min(1).optional(),
    notes: z.string().max(2000).optional(),
    paymentTerms: z.string().trim().max(100).optional(),
    status: storedStatus.optional(),
    theme: z.enum(["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"]).optional(),
    discount: discountSchema,
    additionalCharges: z.coerce.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const idParamSchema = z.object({ id: objectId });

const sendReminderSchema = z.object({
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Enter a payment amount greater than 0."),
  method: z.string().trim().max(60).optional(),
  note: z.string().trim().max(300).optional(),
  date: z.coerce.date().optional(),
});

const paymentIdParamSchema = z.object({
  id: objectId,
  paymentId: objectId,
});

const attachmentIdParamSchema = z.object({
  id: objectId,
  attachmentId: objectId,
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  status: filterStatus.optional(),
  search: z.string().trim().max(100).optional(),
  type: docType,
});

const nextNumberQuerySchema = z.object({ type: docType });

const bulkSchema = z.object({
  ids: z.array(objectId).min(1, "Select at least one invoice"),
  action: z.enum(["markPaid", "markUnpaid", "delete"]),
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  idParamSchema,
  listQuerySchema,
  nextNumberQuerySchema,
  sendReminderSchema,
  paymentSchema,
  paymentIdParamSchema,
  attachmentIdParamSchema,
  bulkSchema,
};
