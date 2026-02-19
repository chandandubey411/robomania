const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ reply: "Please say something." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });


    const prompt = `
    You are a helpful civic assistant for a municipal issue reporting portal.
    User: ${message}
    Answer concisely and helpfully.
    `;

    const result = await model.generateContent(prompt);
    
    // Robust parsing logic
    const candidate = result.response.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;
    
    // Fallback if standard parsing fails (though usually the above path is correct for Gemini 1.5)
    // Sometimes response.text() is safer as it handles some edge cases
    const reply = textPart || "I'm sorry, I couldn't understand that.";

    res.json({ reply });

  } catch (err) {
    console.error("CHATBOT ERROR:", err); // Log the actual error for debugging
    res.status(500).json({ reply: "Chatbot unavailable", error: err.message, details: err.toString() });
  }
};
