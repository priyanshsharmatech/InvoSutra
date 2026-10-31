const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const party = z
  .object({
    businessName: z.string().trim().max(200).optional(),
    clientName: z.string().trim().max(200).optional(),
    email: z.email().optional().or(z.literal("")),
    address: z.string().trim().max(500).optional(),
    phone: z.string().trim().max(30).optional(),
  })
  .optional();

const item = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
});

const createRecurringSchema = z.object({
  billFrom: party,
  billTo: party,
  items: z.array(item).min(1, "Add at least one item"),
  notes: z.string().max(2000).optional(),
  paymentTerms: z.string().trim().max(100).optional(),
  theme: z.enum(["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"]).optional(),
  discount: z
    .object({
      type: z.enum(["flat", "percent"]).optional(),
      value: z.coerce.number().min(0).optional(),
    })
    .optional(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  maxOccurrences: z.coerce.number().int().positive().max(1000).optional(),
  autoEmail: z.coerce.boolean().optional(),
});

const updateRecurringSchema = z
  .object({
    frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
    notes: z.string().max(2000).optional(),
    paymentTerms: z.string().trim().max(100).optional(),
    theme: z.enum(["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"]).optional(),
    active: z.boolean().optional(),
    nextRun: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    maxOccurrences: z.coerce.number().int().positive().max(1000).optional(),
    autoEmail: z.coerce.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

const idParamSchema = z.object({ id: objectId });

module.exports = {
  createRecurringSchema,
  updateRecurringSchema,
  idParamSchema,
};
