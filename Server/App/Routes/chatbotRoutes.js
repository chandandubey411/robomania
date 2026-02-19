// const express = require("express");
// const router = express.Router();
// const { chatbotReply } = require("../Controller/chatbotController");

// router.post("/chat", chatbotReply);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { chat } = require("../Controller/chatbotController");
const { auth } = require("../Middleware/auth");

router.post("/chat", auth, chat);

module.exports = router;
