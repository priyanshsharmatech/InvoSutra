const express = require("express");
const { search } = require("../controllers/searchController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, search);

module.exports = router;
