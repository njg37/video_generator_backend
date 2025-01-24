const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

// Middleware for handling file uploads
router.use(
  fileUpload({
    createParentPath: true, // Ensure directories are created if they don't exist
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50MB
  })
);

// POST route for generating video
router.post("/", async (req, res) => {
  try {
    // Check if files and body are present
    if (!req.files || !req.body) {
      return res.status(400).json({ message: "No files or data provided" });
    }

    // Extract audio file and theme from the request
    const { audioFile } = req.files; // Key in form-data should match 'audioFile'
    const { theme } = req.body;

    // Validate input: check if both audioFile and theme are provided
    if (!audioFile || !theme) {
      return res.status(400).json({ message: "Audio file and theme are required" });
    }

    // Log the uploaded files and body for debugging
    console.log("Uploaded Files:", req.files);
    console.log("Request Body:", req.body);

    // Define file paths
    const audioFileName = audioFile.name;
    const audioPath = path.join(__dirname, "../uploads", audioFileName);
    const themePath = path.join(__dirname, "../uploads", `theme-${Date.now()}.mp4`);
    const outputPath = path.join(__dirname, "../uploads", `output-${Date.now()}.mp4`);

    // Save the uploaded audio file to the server
    await new Promise((resolve, reject) => {
      audioFile.mv(audioPath, (err) => {
        if (err) {
          console.error("Error saving audio file:", err);
          return reject(err);
        }
        resolve();
      });
    });

    // Fetch the video from the Pexels API based on the theme
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    const pexelsResponse = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: pexelsApiKey },
      params: { query: theme, per_page: 1 },
    });

    if (!pexelsResponse.data.videos || pexelsResponse.data.videos.length === 0) {
      return res.status(404).json({ message: "No videos found for the specified theme" });
    }

    const videoUrl = pexelsResponse.data.videos[0].video_files[0].link;

    // Download the video from the URL
    const videoStream = await axios.get(videoUrl, { responseType: "stream" });
    const videoWriteStream = fs.createWriteStream(themePath);

    await new Promise((resolve, reject) => {
      videoStream.data.pipe(videoWriteStream);
      videoWriteStream.on("finish", resolve);
      videoWriteStream.on("error", reject);
    });

    // Generate video using FFmpeg
    ffmpeg()
      .input(themePath) // Input theme video
      .input(audioPath) // Input audio file
      .outputOptions("-c:v copy") // Use the same codec for video
      .outputOptions("-c:a aac") // Convert audio to AAC
      .output(outputPath) // Specify the output file path
      .on("start", (commandLine) => {
        console.log("FFmpeg process started:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("end", () => {
        console.log("Video processing completed successfully.");
        res.status(200).json({
          message: "Video generated successfully",
          video: path.basename(outputPath), // Return the output file name
        });

        // Clean up temporary files
        fs.unlinkSync(audioPath);
        fs.unlinkSync(themePath);
      })
      .on("error", (err) => {
        console.error("Error generating video:", err);
        res.status(500).json({ message: "Error generating video", error: err.message });

        // Clean up temporary files
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        if (fs.existsSync(themePath)) fs.unlinkSync(themePath);
      })
      .run();
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An unexpected error occurred", error: error.message });
  }
});

module.exports = router;
