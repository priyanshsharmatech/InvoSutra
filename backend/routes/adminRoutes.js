const express = require("express");
const {
  getPlatformStats,
  getAllUsers,
  toggleSuspendUser,
  setUserRole,
  deleteUser,
  getAuditLogs,
} = require("../controllers/adminController");
const { protect } = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/adminMiddleware");
const validate = require("../middlewares/validate");
const {
  userListQuerySchema,
  userIdParamSchema,
} = require("../validators/adminValidators");

const router = express.Router();

// Every admin route requires a valid token AND the admin role.
router.use(protect, adminOnly);

router.get("/stats", getPlatformStats);
router.get("/audit-logs", getAuditLogs);
router.get("/users", validate({ query: userListQuerySchema }), getAllUsers);
router.patch(
  "/users/:id/suspend",
  validate({ params: userIdParamSchema }),
  toggleSuspendUser
);
router.patch(
  "/users/:id/role",
  validate({ params: userIdParamSchema }),
  setUserRole
);
router.delete(
  "/users/:id",
  validate({ params: userIdParamSchema }),
  deleteUser
);

module.exports = router;
