const express = require("express");
const router = express.Router();

const { auth } = require("../Middleware/auth");
const isWorker = require("../Middleware/isWorker");
const {
  getAssignedIssues,
  getWorkerStats,
  updateIssueStatus
} = require("../Controller/workerController");

router.get("/issues", auth, isWorker, getAssignedIssues);
router.get("/stats", auth, isWorker, getWorkerStats);
router.patch("/issues/:id", auth, isWorker, updateIssueStatus);

module.exports = router;
