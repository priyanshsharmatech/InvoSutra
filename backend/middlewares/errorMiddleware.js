const env = require("../config/env");
const ApiError = require("../utils/ApiError");

// 404 handler for unmatched routes.
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Centralized error handler. Keep this LAST in the middleware chain.
// Translates known error shapes into clean JSON and hides internals in prod.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  // Mongoose: malformed ObjectId etc.
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for '${err.path}'`;
  }

  // Mongoose: schema validation failure.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Multer: file upload errors (e.g. file too large).
  if (err.name === "MulterError") {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 5 MB)"
        : `Upload error: ${err.message}`;
  }

  // Mongo: duplicate key.
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists`;
  }

  // Never leak internals for unexpected 500s in production.
  if (statusCode >= 500 && env.NODE_ENV === "production") {
    message = "Internal server error";
    details = undefined;
  }

  // Always log the full error server-side.
  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
};

module.exports = { notFound, errorHandler };
