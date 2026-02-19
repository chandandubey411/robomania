// 🔐 ENV MUST LOAD FIRST
require("dotenv").config();

// 🧯 Global Error Safety
process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

const connectDB = require("./App/Config/db");
const cors = require("cors");
const CommunityMessage = require("./App/Models/CommunityMessage");

// 🧪 Confirm keys
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "https://civic-issue-portal-omega.vercel.app",
];

// 🧠 CORS Config
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

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
app.use("/api/community", require("./App/Routes/communityRoutes"));

// 🧪 Health Check
app.get("/ping", (req, res) => res.send("pong"));

// 🔌 Socket.IO — Real-time Community Chat
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible inside route controllers via req.app.get('io')
app.set("io", io);

io.on("connection", (socket) => {
  // Join a socket room for a community
  socket.on("join-room", (communityId) => {
    socket.join(communityId);
    console.log(`Socket ${socket.id} joined room ${communityId}`);
  });

  // Just leaves the socket room; system message is emitted by leaveCommunity controller
  socket.on("leave-room", (communityId) => {
    socket.leave(communityId);
  });

  // Send a chat message — save to DB + broadcast
  socket.on("send-message", async ({ communityId, sender, text }) => {
    try {
      const msg = new CommunityMessage({
        communityId,
        sender: { _id: sender._id, name: sender.name },
        text,
      });
      await msg.save();

      io.to(communityId).emit("receive-message", {
        _id: msg._id,
        communityId,
        sender: { _id: sender._id, name: sender.name },
        text,
        createdAt: msg.createdAt,
      });
    } catch (err) {
      console.error("SOCKET SEND MESSAGE ERROR:", err.message);
      socket.emit("message-error", { error: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// 🚀 Start Server
const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 8080;
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
};

startServer();
