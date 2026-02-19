const Community = require("../Models/Community");
const CommunityMessage = require("../Models/CommunityMessage");

// ─── Create Community ────────────────────────────────────────────────────────
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, category, avatar } = req.body;
    const userId = req.user.userId;

    if (!name) return res.status(400).json({ message: "Community name is required" });

    const existing = await Community.findOne({ name });
    if (existing) return res.status(400).json({ message: "Community name already taken" });

    const community = new Community({
      name,
      description: description || "",
      category: category || "General",
      avatar: avatar || "🏘️",
      createdBy: userId,
      members: [userId], // creator is automatically a member
    });

    await community.save();
    res.status(201).json({ message: "Community created", community });
  } catch (err) {
    console.error("CREATE COMMUNITY ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Get All Communities ──────────────────────────────────────────────────────
exports.getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .populate("joinRequests", "name email");
    res.json(communities);
  } catch (err) {
    console.error("GET ALL COMMUNITIES ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Get Community By ID ──────────────────────────────────────────────────────
exports.getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .populate("joinRequests", "name email");

    if (!community) return res.status(404).json({ message: "Community not found" });
    res.json(community);
  } catch (err) {
    console.error("GET COMMUNITY ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Request to Join (user sends request, creator must approve) ──────────────
exports.requestJoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Community not found" });

    const isCreator = community.createdBy.toString() === userId;
    const isMember = community.members.map(String).includes(userId);
    const hasPending = community.joinRequests.map(String).includes(userId);

    // Creator can always join (they already are a member from creation)
    if (isCreator || isMember) {
      return res.status(200).json({ message: "Already a member", community });
    }

    if (hasPending) {
      return res.status(400).json({ message: "Join request already sent, waiting for approval" });
    }

    community.joinRequests.push(userId);
    await community.save();

    // Notify creator via socket (if io is accessible)
    if (req.app.get("io")) {
      req.app.get("io").to(req.params.id).emit("join-request-update", {
        communityId: req.params.id,
      });
    }

    res.json({ message: "Join request sent. Waiting for creator approval." });
  } catch (err) {
    console.error("REQUEST JOIN ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Approve Join Request (creator only) ─────────────────────────────────────
exports.approveJoin = async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const { userId } = req.params;
    const community = await Community.findById(req.params.id);

    if (!community) return res.status(404).json({ message: "Community not found" });

    if (community.createdBy.toString() !== creatorId) {
      return res.status(403).json({ message: "Only the creator can approve join requests" });
    }

    const hasPending = community.joinRequests.map(String).includes(userId);
    if (!hasPending) {
      return res.status(400).json({ message: "No pending request from this user" });
    }

    // Move from joinRequests → members
    community.joinRequests = community.joinRequests.filter((r) => r.toString() !== userId);
    community.members.push(userId);
    await community.save();

    const updated = await Community.findById(req.params.id)
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .populate("joinRequests", "name email");

    if (req.app.get("io")) {
      req.app.get("io").to(req.params.id).emit("join-request-update", {
        communityId: req.params.id,
      });
      req.app.get("io").to(req.params.id).emit("member-approved", { userId });
    }

    res.json({ message: "User approved", community: updated });
  } catch (err) {
    console.error("APPROVE JOIN ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Reject Join Request (creator only) ──────────────────────────────────────
exports.rejectJoin = async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const { userId } = req.params;
    const community = await Community.findById(req.params.id);

    if (!community) return res.status(404).json({ message: "Community not found" });

    if (community.createdBy.toString() !== creatorId) {
      return res.status(403).json({ message: "Only the creator can reject join requests" });
    }

    community.joinRequests = community.joinRequests.filter((r) => r.toString() !== userId);
    await community.save();

    if (req.app.get("io")) {
      req.app.get("io").to(req.params.id).emit("join-request-update", {
        communityId: req.params.id,
      });
    }

    res.json({ message: "Join request rejected" });
  } catch (err) {
    console.error("REJECT JOIN ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Leave Community ──────────────────────────────────────────────────────────
exports.leaveCommunity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const community = await Community.findById(req.params.id)
      .populate("members", "name");

    if (!community) return res.status(404).json({ message: "Community not found" });

    const leavingUser = community.members.find((m) => m._id.toString() === userId);
    const leavingName = leavingUser?.name || "Someone";

    // Remove from members
    community.members = community.members.filter((m) => m._id.toString() !== userId);
    await community.save();

    // Broadcast system message via socket
    const io = req.app.get("io");
    if (io) {
      const sysMsg = {
        _id: `sys-${Date.now()}`,
        type: "system",
        text: `${leavingName} has left the community`,
        createdAt: new Date().toISOString(),
      };
      io.to(req.params.id).emit("receive-message", sysMsg);
      io.to(req.params.id).emit("join-request-update", { communityId: req.params.id });
    }

    res.json({ message: "Left community" });
  } catch (err) {
    console.error("LEAVE COMMUNITY ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Kick Member (creator only) ───────────────────────────────────────────────
exports.kickMember = async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const { userId } = req.params;
    const community = await Community.findById(req.params.id)
      .populate("members", "name");

    if (!community) return res.status(404).json({ message: "Community not found" });

    if (community.createdBy.toString() !== creatorId) {
      return res.status(403).json({ message: "Only the creator can kick members" });
    }

    if (userId === creatorId) {
      return res.status(400).json({ message: "Creator cannot kick themselves" });
    }

    const kickedUser = community.members.find((m) => m._id.toString() === userId);
    const kickedName = kickedUser?.name || "A member";

    community.members = community.members.filter((m) => m._id.toString() !== userId);
    await community.save();

    const io = req.app.get("io");
    if (io) {
      // System message to the room
      io.to(req.params.id).emit("receive-message", {
        _id: `sys-${Date.now()}`,
        type: "system",
        text: `${kickedName} was kicked from the community`,
        createdAt: new Date().toISOString(),
      });
      // Tell kicked user they were removed
      io.to(req.params.id).emit("user-kicked", { userId });
      // Refresh member list for everyone
      io.to(req.params.id).emit("join-request-update", { communityId: req.params.id });
    }

    res.json({ message: `${kickedName} has been kicked` });
  } catch (err) {
    console.error("KICK MEMBER ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Get Messages ─────────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const messages = await CommunityMessage.find({ communityId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
