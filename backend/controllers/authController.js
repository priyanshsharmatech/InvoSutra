const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const RecurringInvoice = require("../models/RecurringInvoice");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendMail, isEmailConfigured } = require("../utils/email");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// Maps the :type route param to the matching User field.
const BRAND_FIELDS = {
  logo: "brandLogo",
  signature: "signature",
  stamp: "stamp",
};

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const ACCESS_TTL = "30m";
const REFRESH_TTL_DAYS = 7;

// Short-lived access token (sent in the response, used in the Authorization header).
const generateAccessToken = (id) =>
  jwt.sign({ id, type: "access" }, env.JWT_SECRET, { expiresIn: ACCESS_TTL });

// Long-lived refresh token, delivered as an httpOnly cookie.
const generateRefreshToken = (id) =>
  jwt.sign({ id, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: `${REFRESH_TTL_DAYS}d`,
  });

const REFRESH_COOKIE = "refreshToken";
const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
};
const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
};

// Issue a session: set the refresh cookie and return the user payload + access token.
const issueSession = (res, user) => {
  setRefreshCookie(res, generateRefreshToken(user._id));
  return toAuthResponse(user, true);
};

// Shape the public user payload consistently across endpoints.
const toAuthResponse = (user, withToken = false) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  businessName: user.businessName || "",
  address: user.address || "",
  phone: user.phone || "",
  role: user.role || "user",
  brandLogo: user.brandLogo || { url: "", publicId: "" },
  signature: user.signature || { url: "", publicId: "" },
  stamp: user.stamp || { url: "", publicId: "" },
  invoiceTheme: user.invoiceTheme || "classic",
  defaultNotes: user.defaultNotes || "",
  defaultPaymentTerms: user.defaultPaymentTerms || "Net 15",
  autoReminders: user.autoReminders || false,
  gstin: user.gstin || "",
  state: user.state || "",
  invoicePrefix: user.invoicePrefix || "INV",
  docPrefixes: user.docPrefixes
    ? user.docPrefixes.toObject?.() || user.docPrefixes
    : {},
  ...(withToken ? { token: generateAccessToken(user._id) } : {}),
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(issueSession(res, user));
});

// @desc    Login user
// @routes  POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || user.isDeleted || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isSuspended) {
    throw new ApiError(403, "Your account has been suspended");
  }

  res.json(issueSession(res, user));
});

// @desc    Issue a new access token from the refresh cookie
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh cookie)
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token");

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (decoded.type !== "refresh") throw new ApiError(401, "Invalid refresh token");

  const user = await User.findById(decoded.id).select("-password");
  if (!user || user.isDeleted || user.isSuspended) {
    clearRefreshCookie(res);
    throw new ApiError(401, "Session no longer valid");
  }

  // Rotate the refresh token and return a fresh access token.
  res.json(issueSession(res, user));
});

// @desc    Log out — clear the refresh cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
});

// @desc    Login / sign up with a Google ID token
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw new ApiError(503, "Google sign-in is not configured on the server.");
  }

  const { credential } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Could not verify your Google sign-in. Please try again.");
  }

  if (!payload?.email) {
    throw new ApiError(401, "Your Google account did not return an email.");
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (user.isDeleted) throw new ApiError(401, "Invalid credentials");
    if (user.isSuspended) {
      throw new ApiError(403, "Your account has been suspended");
    }
    // Link the Google account to an existing email/password user.
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save({ validateBeforeSave: false });
    }
  } else {
    user = await User.create({
      googleId,
      email,
      name: payload.name || email.split("@")[0],
    });
  }

  res.json(issueSession(res, user));
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");
  res.json(toAuthResponse(user));
});

// @desc    Report which optional integrations are configured (no secrets).
// @route   GET /api/auth/integrations
// @access  Private
exports.getIntegrations = asyncHandler(async (req, res) => {
  res.json({
    email: isEmailConfigured(),
    cloudinary: Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET
    ),
    googleOAuth: Boolean(env.GOOGLE_CLIENT_ID),
  });
});

// @desc    Export all of the user's data as JSON (account backup)
// @route   GET /api/auth/export
// @access  Private
exports.exportData = asyncHandler(async (req, res) => {
  const [invoices, clients, recurring] = await Promise.all([
    Invoice.find({ user: req.user.id }).lean(),
    Client.find({ user: req.user.id }).lean(),
    RecurringInvoice.find({ user: req.user.id }).lean(),
  ]);
  res.json({
    exportedAt: new Date().toISOString(),
    profile: toAuthResponse(req.user),
    counts: {
      invoices: invoices.length,
      clients: clients.length,
      recurring: recurring.length,
    },
    invoices,
    clients,
    recurring,
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  // Email change: enforce uniqueness.
  if (req.body.email && req.body.email !== user.email) {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) throw new ApiError(409, "That email is already in use");
    user.email = req.body.email;
  }

  user.name = req.body.name ?? user.name;
  user.businessName = req.body.businessName ?? user.businessName;
  user.address = req.body.address ?? user.address;
  user.phone = req.body.phone ?? user.phone;
  if (req.body.invoiceTheme) user.invoiceTheme = req.body.invoiceTheme;
  if (req.body.defaultNotes !== undefined)
    user.defaultNotes = req.body.defaultNotes;
  if (req.body.defaultPaymentTerms !== undefined)
    user.defaultPaymentTerms = req.body.defaultPaymentTerms;
  if (req.body.autoReminders !== undefined)
    user.autoReminders = req.body.autoReminders;
  if (req.body.gstin !== undefined) user.gstin = req.body.gstin;
  if (req.body.state !== undefined) user.state = req.body.state;
  if (req.body.invoicePrefix !== undefined)
    user.invoicePrefix = req.body.invoicePrefix;
  if (req.body.docPrefixes !== undefined) {
    user.docPrefixes = { ...user.docPrefixes?.toObject?.() , ...req.body.docPrefixes };
  }

  const updatedUser = await user.save();
  res.json(toAuthResponse(updatedUser));
});

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Generic response regardless of whether the email exists (no account enumeration).
  const genericMessage =
    "If an account with that email exists, a password reset link has been sent.";

  if (!user || user.isDeleted) {
    return res.json({ message: genericMessage });
  }

  // Create a raw token for the link and store only its hash.
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = hashToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.APP_URL}/reset-password/${rawToken}`;

  try {
    await sendMail({
      to: user.email,
      subject: "Reset your InvoSutra password",
      text: `You requested a password reset. Open this link to set a new password (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
      html: `<p>You requested a password reset. Click the link below to set a new password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  } catch (err) {
    // Email not configured or send failed — don't leak details to the client.
    console.error("Password reset email failed:", err.message);
  }

  // In development, return the link directly so it can be tested without email.
  const payload = { message: genericMessage };
  if (env.NODE_ENV === "development" && !isEmailConfigured()) {
    payload.resetUrl = resetUrl;
    payload.note = "Email is not configured; link returned for development only.";
  }
  res.json(payload);
});

// @desc    Reset password using a token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const tokenHash = hashToken(req.params.token);

  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  user.password = password; // hashed by pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password has been reset. You can now log in." });
});

// @desc    Upload / replace a brand asset (logo, signature, or stamp)
// @route   POST /api/auth/brand/:type
// @access  Private
exports.uploadBrandAsset = asyncHandler(async (req, res) => {
  const field = BRAND_FIELDS[req.params.type];
  if (!field) throw new ApiError(400, "Invalid asset type");
  if (!req.file) throw new ApiError(400, "An image file is required");

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  const uploaded = await uploadImage(req.file.buffer, `invosutra/${field}`);

  // Remove the previous asset from Cloudinary, if any.
  if (user[field]?.publicId) {
    await deleteImage(user[field].publicId);
  }

  user[field] = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save({ validateBeforeSave: false });

  res.json(toAuthResponse(user));
});

// @desc    Remove a brand asset
// @route   DELETE /api/auth/brand/:type
// @access  Private
exports.deleteBrandAsset = asyncHandler(async (req, res) => {
  const field = BRAND_FIELDS[req.params.type];
  if (!field) throw new ApiError(400, "Invalid asset type");

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user[field]?.publicId) {
    await deleteImage(user[field].publicId);
  }
  user[field] = { url: "", publicId: "" };
  await user.save({ validateBeforeSave: false });

  res.json(toAuthResponse(user));
});

// @desc    Change the logged-in user's password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const ok = await user.matchPassword(currentPassword);
  if (!ok) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword; // hashed by the pre-save hook
  await user.save();

  res.json({ message: "Password updated successfully" });
});
