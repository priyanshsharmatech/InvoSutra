const express = require("express");

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
  sendReminderEmail,
  getNextInvoiceNumber,
  getClients,
  addPayment,
  deletePayment,
  duplicateInvoice,
  convertEstimate,
  createCreditNote,
  createDebitNote,
  createReceipt,
  bulkUpdate,
  getTrash,
  restoreInvoice,
  purgeInvoice,
  downloadInvoicePdf,
  addAttachment,
  deleteAttachment,
} = require("../controllers/invoiceController.js");
const { protect } = require("../middlewares/authMiddleware.js");
const { uploadPdf, uploadAttachment } = require("../middlewares/upload.js");
const validate = require("../middlewares/validate.js");
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  idParamSchema,
  listQuerySchema,
  nextNumberQuerySchema,
  sendReminderSchema,
  paymentSchema,
  paymentIdParamSchema,
  attachmentIdParamSchema,
  bulkSchema,
} = require("../validators/invoiceValidators.js");

const router = express.Router();

router
  .route("/")
  .post(protect, validate({ body: createInvoiceSchema }), createInvoice)
  .get(protect, validate({ query: listQuerySchema }), getInvoices);

// Literal routes must be registered before "/:id" so they aren't captured by it.
router.get(
  "/next-number",
  protect,
  validate({ query: nextNumberQuerySchema }),
  getNextInvoiceNumber
);
router.get("/clients", protect, getClients);
router.get("/trash", protect, getTrash);
router.get(
  "/:id/pdf",
  protect,
  validate({ params: idParamSchema }),
  downloadInvoicePdf
);
router.post("/bulk", protect, validate({ body: bulkSchema }), bulkUpdate);

router
  .route("/:id")
  .get(protect, validate({ params: idParamSchema }), getInvoiceById)
  .put(
    protect,
    validate({ params: idParamSchema, body: updateInvoiceSchema }),
    updateInvoice
  )
  .delete(protect, validate({ params: idParamSchema }), deleteInvoice);

router.post(
  "/:id/send",
  protect,
  uploadPdf.single("pdf"),
  validate({ params: idParamSchema }),
  sendInvoiceEmail
);

router.post(
  "/:id/send-reminder",
  protect,
  validate({ params: idParamSchema, body: sendReminderSchema }),
  sendReminderEmail
);

router.post(
  "/:id/payments",
  protect,
  validate({ params: idParamSchema, body: paymentSchema }),
  addPayment
);
router.delete(
  "/:id/payments/:paymentId",
  protect,
  validate({ params: paymentIdParamSchema }),
  deletePayment
);

router.post(
  "/:id/attachments",
  protect,
  uploadAttachment.single("file"),
  validate({ params: idParamSchema }),
  addAttachment
);
router.delete(
  "/:id/attachments/:attachmentId",
  protect,
  validate({ params: attachmentIdParamSchema }),
  deleteAttachment
);

router.post(
  "/:id/duplicate",
  protect,
  validate({ params: idParamSchema }),
  duplicateInvoice
);
router.post(
  "/:id/convert",
  protect,
  validate({ params: idParamSchema }),
  convertEstimate
);
router.post(
  "/:id/credit-note",
  protect,
  validate({ params: idParamSchema }),
  createCreditNote
);
router.post(
  "/:id/debit-note",
  protect,
  validate({ params: idParamSchema }),
  createDebitNote
);
router.post(
  "/:id/receipt",
  protect,
  validate({ params: idParamSchema }),
  createReceipt
);
router.post(
  "/:id/restore",
  protect,
  validate({ params: idParamSchema }),
  restoreInvoice
);
router.delete(
  "/:id/permanent",
  protect,
  validate({ params: idParamSchema }),
  purgeInvoice
);

module.exports = router;
