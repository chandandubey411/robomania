const { GoogleGenerativeAI } = require("@google/generative-ai");
const Issue = require("../Models/Issue");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      priority: priority || "Medium",
      createdBy: req.user.id
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
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

// ✅ Get logged-in user's issues
const getUserIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
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
    // If priority existed in schema, we'd query it. For now, returning Pending.
    const issues = await Issue.find({ status: "Pending" }).limit(10);
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ error: "Fetch priority failed" });
  }
};

// ✅ Get Heatmap Data
const getHeatmapData = async (req, res) => {
  try {
    const issues = await Issue.find({}, { location: 1, title: 1 }); // Minimal data
    const heatmapPoints = issues.map(issue => ({
      lat: issue.location.latitude,
      lng: issue.location.longitude,
      weight: 1 // Default weight
    }));
    res.status(200).json(heatmapPoints);
  } catch (err) {
    res.status(500).json({ error: "Fetch heatmap failed" });
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
};
