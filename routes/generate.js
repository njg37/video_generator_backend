const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.post("/", (req, res) => {
  const { audioFile, theme } = req.body;

  // Validate input
  if (!audioFile || !theme) {
    return res.status(400).json({ message: "Audio file and theme are required" });
  }

  const audioPath = path.join(__dirname, "../uploads", audioFile);
  const themePath = path.join(__dirname, "../themes", `${theme.toLowerCase()}.mp4`);
  const outputPath = path.join(__dirname, "../uploads", `output-${Date.now()}.mp4`);

  // Check if audio file exists
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ message: "Audio file not found" });
  }

  // Check if theme file exists
  if (!fs.existsSync(themePath)) {
    return res.status(404).json({ message: "Theme not found" });
  }

  // Generate video using FFmpeg
  ffmpeg()
    .input(themePath) // Input theme video
    .input(audioPath) // Input audio file
    .outputOptions("-c:v copy") // Use the same codec for video
    .outputOptions("-c:a aac") // Convert audio to AAC
    .save(outputPath) // Save the output video
    .on("end", () => {
      res.status(200).json({
        message: "Video generated successfully",
        video: path.basename(outputPath),
      });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Error generating video", error: err.message });
    });
});

module.exports = router;
