// // 🔐 ENV MUST LOAD FIRST
// require("dotenv").config();

// // 🧯 Global Error Safety
// process.on("unhandledRejection", err => {
//   console.error("🔥 UNHANDLED REJECTION:", err);
// });

// process.on("uncaughtException", err => {
//   console.error("💥 UNCAUGHT EXCEPTION:", err);
// });

// const express = require("express");
// const app = express();

// const connectDB = require("./App/Config/db");
// const cors = require("cors");

// // 🧪 Confirm OpenAI key exists
// console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);

// // 🧠 CORS Config
// app.use(cors({
//   origin: [
//     "http://localhost:5173",
//     "http://localhost:8080",
//     "https://civic-issue-portal-omega.vercel.app"
//   ],
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization"],
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
// }));

// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") return res.sendStatus(200);
//   next();
// });

// // 🌐 Body Parsers
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // 📦 App Routes
// app.use("/api/auth", require("./App/Routes/auth"));
// app.use("/api/issues", require("./App/Routes/Issue"));
// app.use("/api/admin/issues", require("./App/Routes/admin"));
// app.use("/api/worker", require("./App/Routes/worker"));
// app.use("/api/chatbot", require("./App/Routes/chatbotRoutes"));
// app.use("/api/location", require("./App/Routes/location"));
// app.use("/api/ai", require("./App/Routes/aiRoutes"));
// app.use("/api/vision", require("./App/Routes/visionRoutes"));

// // 🧪 Health Check
// app.get("/ping", (req, res) => res.send("pong"));

// // 🚀 Start Server
// const startServer = async () => {
//   try {
//     await connectDB();
//     const port = process.env.PORT || 8080;
//     app.listen(port, () => {
//       console.log(`🚀 Server running on port ${port}`);
//     });
//   } catch (err) {
//     console.error("❌ Server failed to start:", err);
//     process.exit(1);
//   }
// };

// startServer();

// 🔐 ENV MUST LOAD FIRST
require("dotenv").config();

// 🧯 Global Error Safety
process.on("unhandledRejection", err => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", err => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
});

const express = require("express");
const app = express();

const connectDB = require("./App/Config/db");
const cors = require("cors");

// 🧪 Confirm Gemini key exists
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);

// 🧠 Proper CORS Configuration (PATCH FIXED)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "https://civic-issue-portal-omega.vercel.app"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});


// 🌐 Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📦 App Routes
app.use("/api/auth", require("./App/Routes/auth"));
app.use("/api/issues", require("./App/Routes/Issue"));
app.use("/api/admin/issues", require("./App/Routes/admin"));
app.use("/api/worker", require("./App/Routes/worker"));
app.use("/api/chatbot", require("./App/Routes/chatbotRoutes"));
app.use("/api/location", require("./App/Routes/location"));
app.use("/api/ai", require("./App/Routes/aiRoutes"));
app.use("/api/vision", require("./App/Routes/visionRoutes"));

// 🧪 Health Check
app.get("/ping", (req, res) => res.send("pong"));

// 🚀 Start Server
const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
};

startServer();
