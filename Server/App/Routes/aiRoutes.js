const express = require("express");
const router = express.Router();
const { analyzeText } = require("../Controller/aiController");
const { auth } = require("../Middleware/auth");

router.post("/analyze", auth, analyzeText);

module.exports = router;
