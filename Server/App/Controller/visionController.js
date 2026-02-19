const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        title: "No Image",
        description: "Please upload an image",
        category: "Other"
      });
    }

    // 1. Upload to Cloudinary to get persistent URL
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "civic-issues" },
        (error, result) => error ? reject(error) : resolve(result)
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    // 2. Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });


    const prompt = `
    You are a civic issue reporting AI.
    Analyze the image and return STRICT JSON only.
    
    Categories:
    Garbage, Water Leak, Sewage, Pothole, Streetlight, Traffic, Electricity, Other
    
    Format:
    {
      "title": "",
      "description": "",
      "category": ""
    }
    `;

    // Convert buffer to base64 for Gemini
    const base64Image = req.file.buffer.toString("base64");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: req.file.mimetype
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("GEMINI VISION RESPONSE:", text);

    // 3. Parse JSON safely
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let json;
    try {
        json = JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        json = {
            title: "Issue Detected",
            description: cleanedText, 
            category: "Other"
        };
    }

    // 4. Return combined data
    res.json({
        ...json,
        imageUrl: uploadResult.secure_url
    });

  } catch (err) {
    console.error("🔥 Vision Error:", err.message);
    res.status(500).json({
      title: "Analysis Failed",
      description: "Please enter details manually.",
      category: "Other",
      error: err.message,
      details: err.toString()
    });
  }
};
