const { GoogleGenerativeAI } = require("@google/generative-ai");
const Issue = require("../Models/Issue");

let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else {
    console.warn("⚠️ GEMINI_API_KEY is missing in environment variables.");
  }
} catch (error) {
  console.error("Error initializing GoogleGenerativeAI:", error);
}

// ✅ Create Issue
const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      image,
      latitude,
      longitude,
      address,
      city,
      state,
      assignedTo,
      priority
    } = req.body;

    // 🔒 Basic validation
    if (!title || !description || !image) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Location is required" });
    }

    let finalPriority = priority || "Medium";

    // 🤖 AI Priority Assessment
    if (!priority && description) {
      try {
        if (!process.env.GEMINI_API_KEY) {
          console.warn("⚠️ GEMINI_API_KEY missing, skipping AI priority");
        } else {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `Analyze this civic issue: "${title} - ${description}".
                Assign priority: High (Safety hazard, fire, severe), Medium (Garbage, pothole), Low (Minor).
                Return ONLY one word: High, Medium, or Low.`;

          const result = await model.generateContent(prompt);
          const aiText = result.response.text().trim().replace(/\n/g, '').replace(/\./g, '');

          if (["High", "Medium", "Low"].includes(aiText)) {
            finalPriority = aiText;
          }
        }
      } catch (aiErr) {
        console.error("AI Priority Failed:", aiErr);
      }
    }

    const newIssue = new Issue({
      title,
      description,
      category,
      imageURL: image, // ✅ correct mapping
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        city,
        state,
      },
      assignedTo: assignedTo || "General",
      priority: finalPriority,
      createdBy: req.user.userId
    });

    const savedIssue = await newIssue.save();
    res.status(201).json(savedIssue);

  } catch (err) {
    console.error("Create Issue Error 👇", err.errors || err);
    res.status(500).json({ error: "Create issue failed" });
  }
};


// ✅ Get all issues (Admin/Public)
const getIssues = async (req, res) => {
  try {
    console.log("⚡ FETCHING ISSUES...");
    const issues = await Issue.find().sort({ createdAt: -1 });
    console.log(`✅ FOUND ${issues ? issues.length : 0} ISSUES`);

    if (!issues) {
      return res.status(200).json([]);
    }

    res.status(200).json(issues);
  } catch (err) {
    console.error("❌ Get Issues Error:", err);
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

// ✅ Get logged-in user's issues
const getUserIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

// ✅ AI Analyze Issue
const analyzeIssue = async (req, res) => {
  try {
    const { title, description, location } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
Title: ${title}
Description: ${description}
Location: ${location || "Not provided"}
`;

    const result = await model.generateContent(prompt);

    res.status(200).json({
      success: true,
      analysis: result.response.text(),
    });
  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "AI failed" });
  }
};


// ✅ Update Issue
const updateIssue = async (req, res) => {
  try {
    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedIssue);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// ✅ Delete Issue
const deleteIssue = async (req, res) => {
  try {
    await Issue.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Issue deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

// ✅ Get AI Priority Issues
const getAIPriorityIssues = async (req, res) => {
  try {
    console.log("⚡ FETCHING AI PRIORITY ISSUES...");
    const issues = await Issue.find({ priority: "High" }).sort({ createdAt: -1 }).limit(10);
    console.log(`✅ FOUND ${issues.length} HIGH PRIORITY ISSUES`);

    // Fallback: If no High priority, show some recent ones to avoid empty state during testing
    if (issues.length === 0) {
      console.log("⚠️ No High priority issues, fetching recent ones as fallback...");
      const recentIssues = await Issue.find().sort({ createdAt: -1 }).limit(5);
      return res.status(200).json(recentIssues);
    }

    res.status(200).json(issues);
  } catch (err) {
    console.error("❌ Get AI Priority Error:", err);
    res.status(500).json({ error: "Fetch priority failed", details: err.message });
  }
};

// ✅ Get Heatmap Data
const getHeatmapData = async (req, res) => {
  try {
    console.log("⚡ FETCHING HEATMAP DATA...");
    const issues = await Issue.find({}, { location: 1, title: 1 }); // Minimal data

    if (!issues || !Array.isArray(issues)) {
      console.warn("⚠️ No issues found or invalid format for heatmap");
      return res.status(200).json([]);
    }

    const heatmapPoints = issues
      .filter(issue => issue.location && issue.location.latitude && issue.location.longitude)
      .map(issue => ({
        lat: issue.location.latitude,
        lng: issue.location.longitude,
        weight: 1 // Default weight
      }));

    console.log(`✅ RETURNING ${heatmapPoints.length} HEATMAP POINTS`);
    res.status(200).json(heatmapPoints);
  } catch (err) {
    console.error("❌ Get Heatmap Error:", err);
    res.status(500).json({ error: "Fetch heatmap failed", details: err.message });
  }
};

// ❤️ Toggle Like
const likeIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const userId = req.user.userId;
    if (issue.likes.includes(userId)) {
      issue.likes = issue.likes.filter((id) => id.toString() !== userId);
    } else {
      issue.likes.push(userId);
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
};

// 💬 Add Comment
const commentIssue = async (req, res) => {
  try {
    const { text, userName } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const newComment = {
      user: req.user.userId,
      userName: userName || "Anonymous", // Fallback if name not passed
      text,
      createdAt: new Date(),
    };

    issue.comments.push(newComment);
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Comment failed" });
  }
};

// 🚀 Share Issue (Increment Count)
const shareIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    issue.shares = (issue.shares || 0) + 1;
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: "Share failed" });
  }
};

// ✅ EXPORT EVERYTHING (ONE PLACE ONLY)
module.exports = {
  createIssue,
  getIssues,
  getUserIssues,
  analyzeIssue,
  updateIssue,
  deleteIssue,
  getAIPriorityIssues,
  getHeatmapData,
  likeIssue,
  commentIssue,
  shareIssue,
};
