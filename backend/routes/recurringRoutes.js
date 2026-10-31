const express = require("express");
const {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  runRecurringNow,
} = require("../controllers/recurringController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  createRecurringSchema,
  updateRecurringSchema,
  idParamSchema,
} = require("../validators/recurringValidators");

const router = express.Router();

router
  .route("/")
  .get(protect, getRecurring)
  .post(protect, validate({ body: createRecurringSchema }), createRecurring);

router
  .route("/:id")
  .put(
    protect,
    validate({ params: idParamSchema, body: updateRecurringSchema }),
    updateRecurring
  )
  .delete(protect, validate({ params: idParamSchema }), deleteRecurring);

router.post(
  "/:id/run",
  protect,
  validate({ params: idParamSchema }),
  runRecurringNow
);

module.exports = router;
