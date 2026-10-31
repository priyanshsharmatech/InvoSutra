const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { sendMail } = require("../utils/email");

// @desc    Submit the public contact form (emails the site owner)
// @route   POST /api/contact
// @access  Public
exports.submitContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const to = env.CONTACT_EMAIL || env.GMAIL_USER;
  if (!to) {
    throw new ApiError(
      503,
      "The contact form is not configured on the server yet."
    );
  }

  await sendMail({
    to,
    replyTo: email, // so you can reply straight to the sender
    subject: `New contact message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px">
        <h2 style="margin:0 0 12px">New contact message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="white-space:pre-line;margin-top:12px">${message}</p>
      </div>`,
  });

  res.json({ message: "Thanks for reaching out! We'll get back to you soon." });
});
