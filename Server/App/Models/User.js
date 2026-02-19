const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "admin", "worker"],
      default: "user",
    },

    // 🧰 Worker specific
    department: {
      type: String,
      enum: [
        "Public Works Department (PWD)",
        "Municipal Sanitation Team",
        "Water Supply Department",
        "Road Maintenance Division",
        "Streetlight Maintenance Unit",
        "Drainage & Sewage Department",
        "Waste Management Authority",
        "Parks & Horticulture Department",
        "Traffic & Road Safety Cell",
        "Building & Construction Division",
      ],
      required: function () {
        return this.role === "worker";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
