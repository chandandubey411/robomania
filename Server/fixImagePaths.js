require("dotenv").config();
const mongoose = require("mongoose");
const Issue = require("./App/Models/Issue");

mongoose.connect(process.env.MONGO_URI);

async function fix() {
  const issues = await Issue.find();

  for (const issue of issues) {
    if (!issue.imageURL) continue;

    const cleaned = issue.imageURL
      .replace(/^.*?uploads/, "uploads")
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/");

    if (issue.imageURL !== cleaned) {
      issue.imageURL = cleaned;
      await issue.save();
      console.log("✔ fixed:", cleaned);
    }
  }

  console.log("🎉 All image paths cleaned");
  process.exit();
}

fix();
