const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("A valid email is required").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.email("A valid email is required").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email("A valid email is required").toLowerCase().optional(),
    businessName: z.string().trim().max(200).optional(),
    address: z.string().trim().max(500).optional(),
    phone: z.string().trim().max(30).optional(),
    invoiceTheme: z
      .enum(["classic", "modern", "minimal", "corporate", "elegant", "bold", "compact"])
      .optional(),
    defaultNotes: z.string().max(2000).optional(),
    defaultPaymentTerms: z.string().trim().max(100).optional(),
    autoReminders: z.coerce.boolean().optional(),
    gstin: z.string().trim().max(20).optional(),
    state: z.string().trim().max(60).optional(),
    invoicePrefix: z.string().trim().max(10).optional(),
    docPrefixes: z
      .object({
        invoice: z.string().trim().max(10).optional(),
        estimate: z.string().trim().max(10).optional(),
        creditnote: z.string().trim().max(10).optional(),
        proforma: z.string().trim().max(10).optional(),
        debitnote: z.string().trim().max(10).optional(),
        receipt: z.string().trim().max(10).optional(),
        purchaseorder: z.string().trim().max(10).optional(),
      })
      .optional(),
  })
  .strip();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.email("A valid email is required").toLowerCase(),
});

const googleAuthSchema = z.object({
  credential: z.string().min(10, "A Google credential is required"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
};
