const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../Middleware/auth.js");
const adminOnly = require("../Middleware/admin.js");
const { getIssues, updateIssue, deleteIssue } = require("../Controller/IssueController.js");

const { getAIPriorityIssues } = require("../Controller/IssueController");

const { getHeatmapData } = require("../Controller/IssueController");


// ✅ Admin can view, update, and delete issues
router.get("/", auth, adminOnly, getIssues);
router.patch("/:id", auth, adminOnly, updateIssue);
router.delete("/:id", auth, adminOnly, deleteIssue);

// router.get("/all", auth, isAdmin, getAllIssues);
router.get("/ai-priority", auth, isAdmin, getAIPriorityIssues);
router.get("/heatmap", auth, isAdmin, getHeatmapData);




module.exports = router;