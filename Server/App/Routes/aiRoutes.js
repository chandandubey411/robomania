const express = require("express");
const router = express.Router();
const { analyzeText } = require("../Controller/aiController");
const { getAiTrends } = require("../Controller/aiTrendController");
const { auth } = require("../Middleware/auth");

router.post("/analyze", auth, analyzeText);
router.get("/trends", auth, getAiTrends);

module.exports = router;
