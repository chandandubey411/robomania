const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeText = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.json({ category: "Other", priority: "Low" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
    You are a civic issue classification system.
    
    Respond ONLY in JSON (no markdown formatting):
    {
      "category": "Garbage | Water Leak | Road Safety | Pothole | Streetlight | Other",
      "priority": "Low | Medium | High"
    }
    
    Title: ${title}
    Description: ${description}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean potential markdown fencing
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(cleanedText);

    res.json(json);
  } catch (err) {
    console.error("AI TEXT ERROR:", err);
    res.json({ category: "Other", priority: "Medium" });
  }
};
