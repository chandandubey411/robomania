const express = require("express");
const router = express.Router();

router.get("/reverse", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Civic-Issue-Portal" }
    });

    const data = await response.json();
    return res.json(data);

  } catch (err) {
    console.error("LOCATION ERROR:", err);
    return res.status(500).json({ error: "Location fetch failed" });
  }
});

module.exports = router;
