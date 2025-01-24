const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

// Theme video fetching logic
router.get("/:theme", async (req, res) => {
  const { theme } = req.params;

  // Define theme keywords for Pexels API
  const themeKeywords = {
    minimalistic: "minimalistic background",
    neon: "neon lights",
    retro: "retro background",
    default: "abstract background",
  };

  // Get the query based on theme or use default
  const query = themeKeywords[theme.toLowerCase()] || themeKeywords["default"];

  console.log(`Searching for theme: ${query}`); // Debugging log to check the query being sent to Pexels API

  try {
    // Pexels API request to fetch video based on theme
    const response = await axios.get("https://api.pexels.com/videos/search", {
      params: { query, per_page: 1 },
      headers: {
        Authorization: process.env.PEXELS_API_KEY, // Ensure your API key is correct
      },
    });

    const videoUrl = response.data.videos[0]?.video_files[0]?.link || null;

    // If video URL not found, return 404
    if (!videoUrl) {
      return res.status(404).json({ message: "Theme video not found" });
    }

    // Send success response with the video URL
    res.status(200).json({
      message: "Theme video fetched successfully",
      videoUrl,
    });
  } catch (error) {
    console.error("Error fetching theme video:", error.message); // Log the error message for debugging
    res.status(500).json({
      message: "Error fetching theme video",
      error: error.message,
    });
  }
});

module.exports = router;
