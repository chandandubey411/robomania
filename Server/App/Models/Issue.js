const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageURL: { type: String },

    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
    },

    category: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },
    proofImage: {
      type: String,
      default: null
    },

    // 🧑‍🔧 NEW FIELD (THIS FIXES WORKER DASHBOARD)
    assignedTo: {
      type: String,
      default: ""
    },

    resolutionNotes: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ❤️ Social Interactions
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        // We'll store name temporarily to avoid complex populations if needed, 
        // but ideally population is better. Let's start simple.
        userName: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      }
    ],

    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
