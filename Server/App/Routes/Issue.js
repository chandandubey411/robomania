const express = require("express");
const router = express.Router();
const { auth } = require("../Middleware/auth");

const {
  createIssue,
  getIssues,
  getUserIssues,
  analyzeIssue,
  likeIssue,
  commentIssue,
  shareIssue
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
// ❤️ Like & Comment & Share
router.put("/:id/like", auth, likeIssue);
router.post("/:id/comment", auth, commentIssue);
router.put("/:id/share", shareIssue); // Share doesn't strictly need auth if it's just a count, but usually good. Let's keep it public for wider reach or auth? User request didn't specify. Public is easier for "sharing".

console.log("analyzeIssue:", analyzeIssue);


module.exports = router;
