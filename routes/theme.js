const express = require("express");

const router = express.Router();

// Sample themes
const themes = ["Default", "Neon", "Retro", "Minimalistic"];

// Get available themes
router.get("/", (req, res) => {
  res.status(200).json({ themes });
});

// Apply selected theme
router.post("/", (req, res) => {
  const { theme } = req.body;

  if (!themes.includes(theme)) {
    return res.status(400).json({ message: "Invalid theme" });
  }

  res.status(200).json({ message: `Theme '${theme}' applied successfully` });
});

module.exports = router;
