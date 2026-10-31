const multer = require("multer");
const ApiError = require("../utils/ApiError");

// Keep uploads in memory — we forward the bytes straight to Gemini and never
// persist them to disk.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only image files are allowed"));
    }
  },
});

// Accepts a single PDF (used to attach a generated invoice PDF to an email).
const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new ApiError(400, "Only PDF files are allowed"));
  },
});

// Accepts a single file of common document/image types (invoice attachments).
const ALLOWED_ATTACHMENT = [
  "application/pdf",
  "image/",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
];
const uploadAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_ATTACHMENT.some((t) => file.mimetype.startsWith(t))) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Unsupported file type"));
    }
  },
});

module.exports = upload;
module.exports.uploadPdf = uploadPdf;
module.exports.uploadAttachment = uploadAttachment;
