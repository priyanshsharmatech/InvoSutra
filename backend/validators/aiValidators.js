const { z } = require("zod");

const parseTextSchema = z.object({
  text: z.string().trim().min(1, "Text is required").max(10000),
});

const reminderSchema = z.object({
  invoiceId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "A valid invoiceId is required"),
});

module.exports = { parseTextSchema, reminderSchema };
