const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  uploadBrandAsset,
  deleteBrandAsset,
  refresh,
  logout,
  getIntegrations,
  exportData,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiters");
const upload = require("../middlewares/upload");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} = require("../validators/authValidators");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  registerUser
);
router.post("/login", authLimiter, validate({ body: loginSchema }), loginUser);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post(
  "/google",
  authLimiter,
  validate({ body: googleAuthSchema }),
  googleLogin
);
router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);
router.post(
  "/reset-password/:token",
  authLimiter,
  validate({ body: resetPasswordSchema }),
  resetPassword
);
router.get("/integrations", protect, getIntegrations);
router.get("/export", protect, exportData);

router
  .route("/me")
  .get(protect, getMe)
  .put(protect, validate({ body: updateProfileSchema }), updateUserProfile);

router.put(
  "/change-password",
  protect,
  validate({ body: changePasswordSchema }),
  changePassword
);

router
  .route("/brand/:type")
  .post(protect, upload.single("file"), uploadBrandAsset)
  .delete(protect, deleteBrandAsset);

module.exports = router;
