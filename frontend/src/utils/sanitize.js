// Shared input sanitizers so field rules stay consistent across forms.

// Phone: digits plus the usual separators (+, -, spaces, parentheses).
export const sanitizePhone = (v) => String(v).replace(/[^0-9+\-()\s]/g, "");

// GSTIN: 15-char uppercase alphanumeric.
export const sanitizeGstin = (v) =>
  String(v).toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);

// Person / business name: letters, spaces, and name-safe punctuation only.
export const sanitizeName = (v) => String(v).replace(/[^a-zA-Z\s.'&-]/g, "");

// Optional email: empty is allowed; otherwise must look like an address.
export const emailError = (v) =>
  v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    ? "Please enter a valid email address"
    : "";
