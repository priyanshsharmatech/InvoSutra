const { z } = require("zod");

// Validate and normalize environment variables once, at boot.
// If anything required is missing or malformed we fail fast with a clear message.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters long"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  // Google OAuth client ID (optional — Google sign-in is disabled if unset).
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Comma-separated list of allowed origins, or "*" for any.
  CLIENT_ORIGIN: z.string().default("*"),
  // Public URL of the frontend, used to build links in emails (password reset).
  APP_URL: z.string().default("http://localhost:5173"),
  // Email (Gmail SMTP via App Password). Optional — email features are
  // disabled gracefully when these are not set.
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  MAIL_FROM_NAME: z.string().default("InvoSutra"),
  // Where contact-form submissions are delivered (falls back to GMAIL_USER).
  CONTACT_EMAIL: z.string().optional(),
  // Cloudinary (optional — brand asset uploads are disabled gracefully if unset).
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`\n❌ Invalid environment configuration:\n${details}\n`);
  process.exit(1);
}

module.exports = parsed.data;
