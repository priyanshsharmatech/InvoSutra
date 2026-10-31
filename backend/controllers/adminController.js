const User = require("../models/User");
const Invoice = require("../models/Invoice");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// Record a privileged admin action (best-effort; never blocks the request).
const recordAudit = async (req, action, target, details) => {
  try {
    await AuditLog.create({
      actor: req.user._id,
      actorEmail: req.user.email,
      action,
      targetUser: target?._id,
      targetEmail: target?.email,
      details,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
};

// @desc    Platform-wide stats (all users)
// @route   GET /api/admin/stats
// @access  Admin
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const [userAgg] = await User.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        adminUsers: {
          $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
        },
        suspendedUsers: {
          $sum: { $cond: ["$isSuspended", 1, 0] },
        },
      },
    },
  ]);

  const [invAgg] = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$total", 0] },
        },
        totalOutstanding: {
          $sum: { $cond: [{ $eq: ["$status", "Unpaid"] }, "$total", 0] },
        },
      },
    },
  ]);

  res.json({
    users: {
      total: userAgg?.totalUsers || 0,
      admins: userAgg?.adminUsers || 0,
      suspended: userAgg?.suspendedUsers || 0,
    },
    invoices: {
      total: invAgg?.totalInvoices || 0,
      totalRevenue: invAgg?.totalRevenue || 0,
      totalOutstanding: invAgg?.totalOutstanding || 0,
    },
  });
});

// @desc    List all users (paginated, searchable) with invoice counts
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const skip = (page - 1) * limit;

  const match = { isDeleted: { $ne: true } };
  if (search) {
    const regex = new RegExp(search, "i");
    match.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "invoices",
          localField: "_id",
          foreignField: "user",
          as: "invs",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          isSuspended: 1,
          businessName: 1,
          createdAt: 1,
          invoiceCount: { $size: "$invs" },
        },
      },
    ]),
    User.countDocuments(match),
  ]);

  res.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// @desc    Suspend / unsuspend a user
// @route   PATCH /api/admin/users/:id/suspend
// @access  Admin
exports.toggleSuspendUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, "User not found");

  if (target._id.toString() === req.user.id) {
    throw new ApiError(400, "You cannot suspend your own account");
  }
  if (target.role === "admin") {
    throw new ApiError(403, "Admin accounts cannot be suspended");
  }

  target.isSuspended = !target.isSuspended;
  await target.save();

  await recordAudit(
    req,
    target.isSuspended ? "user.suspend" : "user.reactivate",
    target
  );

  res.json({
    message: target.isSuspended ? "User suspended" : "User reactivated",
    isSuspended: target.isSuspended,
  });
});

// @desc    Promote a user to admin, or demote an admin to user
// @route   PATCH /api/admin/users/:id/role
// @access  Admin
exports.setUserRole = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target || target.isDeleted) throw new ApiError(404, "User not found");

  if (target._id.toString() === req.user.id) {
    throw new ApiError(400, "You cannot change your own role");
  }

  target.role = target.role === "admin" ? "user" : "admin";
  await target.save();

  await recordAudit(
    req,
    target.role === "admin" ? "user.promote" : "user.demote",
    target
  );

  res.json({
    message:
      target.role === "admin"
        ? "User promoted to admin"
        : "Admin demoted to user",
    role: target.role,
  });
});

// @desc    Soft-delete a user (deactivate). Their invoices are preserved.
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target || target.isDeleted) throw new ApiError(404, "User not found");

  if (target._id.toString() === req.user.id) {
    throw new ApiError(400, "You cannot delete your own account");
  }
  if (target.role === "admin") {
    throw new ApiError(403, "Admin accounts cannot be deleted");
  }

  // Soft delete: keep the record (and their invoices) but deactivate the
  // account so it can't log in and no longer appears in listings.
  target.isDeleted = true;
  target.isSuspended = true;
  target.deletedAt = new Date();
  await target.save();

  await recordAudit(req, "user.delete", target);

  res.json({ message: "User deactivated (soft-deleted)" });
});

// @desc    Recent admin audit log
// @route   GET /api/admin/audit-logs
// @access  Admin
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ data: logs });
});
