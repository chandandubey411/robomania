const express = require("express");
const router = express.Router();
const { auth } = require("../Middleware/auth");

const {
  createIssue,
  getIssues,
  getUserIssues,
  analyzeIssue
} = require("../Controller/IssueController");

router.post("/analyze", analyzeIssue);

// 🆕 Create Issue
router.post("/", auth, createIssue);

// 📦 Fetch all issues
router.get("/", getIssues);

// 👤 Fetch logged-in user's issues
router.get("/my", auth, getUserIssues);

// 🤖 AI analyze issue
// router.post("/analyze", analyzeIssue);
console.log("analyzeIssue:", analyzeIssue);


module.exports = router;
