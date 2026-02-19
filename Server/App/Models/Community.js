const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Road & Traffic",
        "Water & Sanitation",
        "Electricity",
        "Public Safety",
        "Environment",
        "Public Health",
        "Parks & Recreation",
        "General",
      ],
      default: "General",
    },
    // emoji or color for avatar
    avatar: {
      type: String,
      default: "🏘️",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Pending join requests - stored until creator approves/rejects
    joinRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Community", communitySchema);
