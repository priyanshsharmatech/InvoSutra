const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const createClientSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required").max(200),
  email: z.email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  gstin: z.string().trim().max(20).optional(),
  state: z.string().trim().max(60).optional(),
  defaultPaymentTerms: z.string().trim().max(100).optional(),
  defaultNotes: z.string().trim().max(2000).optional(),
});

const updateClientSchema = createClientSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: "At least one field must be provided" }
);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  search: z.string().trim().max(100).optional(),
});

const idParamSchema = z.object({ id: objectId });

module.exports = {
  createClientSchema,
  updateClientSchema,
  listQuerySchema,
  idParamSchema,
};
