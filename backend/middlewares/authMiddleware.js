const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Not authorized, token failed!");
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user || user.isDeleted) {
    throw new ApiError(401, "Not authorized, user not found");
  }
  if (user.isSuspended) {
    throw new ApiError(403, "Your account has been suspended");
  }

  req.user = user;
  next();
});

module.exports = { protect };
