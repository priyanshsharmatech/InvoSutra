const ApiError = require("../utils/ApiError");

// Must run after `protect`. Allows only users with the admin role.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  throw new ApiError(403, "Admin access required");
};

module.exports = { adminOnly };
