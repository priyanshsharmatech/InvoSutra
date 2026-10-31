const ApiError = require("../utils/ApiError");

// Returns middleware that validates the given request parts against zod schemas.
// Usage: validate({ body: schema, query: schema, params: schema })
// On success, replaces req[part] with the parsed (coerced/defaulted) value.
const validate = (schemas) => (req, res, next) => {
  for (const part of ["body", "query", "params"]) {
    const schema = schemas[part];
    if (!schema) continue;

    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || part,
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", details));
    }

    // In Express 5 `req.query` (and sometimes `req.params`) is a getter, and a
    // plain assignment to it silently no-ops instead of throwing. Always define
    // an own data property so the parsed/coerced value reliably reaches handlers.
    Object.defineProperty(req, part, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
};

module.exports = validate;
