const express = require("express");
const {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientTrash,
  restoreClient,
  purgeClient,
} = require("../controllers/clientController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  createClientSchema,
  updateClientSchema,
  listQuerySchema,
  idParamSchema,
} = require("../validators/clientValidators");

const router = express.Router();

router
  .route("/")
  .get(protect, validate({ query: listQuerySchema }), getClients)
  .post(protect, validate({ body: createClientSchema }), createClient);

router.get("/trash", protect, getClientTrash);

router
  .route("/:id")
  .put(
    protect,
    validate({ params: idParamSchema, body: updateClientSchema }),
    updateClient
  )
  .delete(protect, validate({ params: idParamSchema }), deleteClient);

router.post(
  "/:id/restore",
  protect,
  validate({ params: idParamSchema }),
  restoreClient
);
router.delete(
  "/:id/permanent",
  protect,
  validate({ params: idParamSchema }),
  purgeClient
);

module.exports = router;
