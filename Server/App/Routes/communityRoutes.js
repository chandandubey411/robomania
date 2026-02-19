const express = require("express");
const router = express.Router();
const { auth } = require("../Middleware/auth");
const {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  requestJoin,
  approveJoin,
  rejectJoin,
  kickMember,
  leaveCommunity,
  getMessages,
} = require("../Controller/communityController");

// Public
router.get("/", getAllCommunities);
router.get("/:id", getCommunityById);
router.get("/:id/messages", getMessages);

// Auth required
router.post("/", auth, createCommunity);
router.post("/:id/join", auth, requestJoin);
router.post("/:id/approve/:userId", auth, approveJoin);
router.post("/:id/reject/:userId", auth, rejectJoin);
router.post("/:id/kick/:userId", auth, kickMember);  // 👑 Creator kicks member
router.post("/:id/leave", auth, leaveCommunity);

module.exports = router;
