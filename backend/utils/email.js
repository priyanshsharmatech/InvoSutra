const nodemailer = require("nodemailer");
const env = require("../config/env");
const ApiError = require("./ApiError");

// Email is optional: only build a transporter when Gmail creds are present.
const isEmailConfigured = () =>
  Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);

let transporter = null;
if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });
}

// Send an email. Throws a 503 ApiError if email isn't configured so callers
// surface a clean message instead of crashing.
const sendMail = async ({ to, subject, text, html, attachments, replyTo }) => {
  if (!transporter) {
    throw new ApiError(
      503,
      "Email is not configured on the server. Add GMAIL_USER and GMAIL_APP_PASSWORD to enable sending."
    );
  }
  if (!to) {
    throw new ApiError(400, "No recipient email address available");
  }

  return transporter.sendMail({
    from: `"${env.MAIL_FROM_NAME}" <${env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments ? { attachments } : {}),
  });
};

module.exports = { sendMail, isEmailConfigured };
