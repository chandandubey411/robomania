const express = require("express");
const router = express.Router();
const { startSimulation, stopSimulation, triggerSingle, getStatus } = require("../Controller/IoTController");

// Basic manual trigger routes - no auth middleware for hackathon demo ease, or add checkAdmin if needed
router.post("/start", startSimulation);
router.post("/stop", stopSimulation);
router.post("/trigger", triggerSingle);
router.get("/status", getStatus);

module.exports = router;
