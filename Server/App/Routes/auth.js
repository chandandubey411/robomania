const express = require("express");
const router = express.Router();

const { register, login } = require("../Controller/authController");

// Routes
router.post("/signup", register);
router.post("/login", login);

module.exports = router;