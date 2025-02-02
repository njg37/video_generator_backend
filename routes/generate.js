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
   createParentPath: true,
   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
 })
);

router.post("/", async (req, res) => {
 try {
   // Check if files or filename is present
   if (!req.files && !req.body.audioFilename) {
     return res.status(400).json({ message: "No files or data provided" });
   }

   // Extract audio file or filename
   const audioFile = req.files?.audioFile;
   const audioFilename = req.body.audioFilename;
   const { theme } = req.body;

   // Validate input
   if ((!audioFile && !audioFilename) || !theme) {
     return res.status(400).json({ message: "Audio file and theme are required" });
   }

   // Log incoming data for debugging
   console.log("Received Files:", req.files);
   console.log("Received Body:", req.body);

   // Determine audio path
   let audioPath;
   if (audioFile) {
     // If a new file is uploaded
     audioPath = path.join(__dirname, "../uploads", audioFile.name);
     await new Promise((resolve, reject) => {
       audioFile.mv(audioPath, (err) => {
         if (err) return reject(err);
         resolve();
       });
     });
   } else {
     // If using a previously uploaded file
     audioPath = path.join(__dirname, "../uploads", audioFilename);
   }

   // Define file paths
   const themePath = path.join(__dirname, "../uploads", `theme-${Date.now()}.mp4`);
   const outputPath = path.join(__dirname, "../uploads", `output-${Date.now()}.mp4`);

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
   .input(themePath)
   .input(audioPath)
   .audioCodec('aac')
   .videoCodec('libx264')
   .outputOptions([
     "-map", "0:v",  // Video from first input
     "-map", "1:a",  // Audio from second input
     "-shortest"     // Ensure output matches shortest input duration
   ])
   .output(outputPath)
   .on("start", (commandLine) => {
     console.log("FFmpeg command:", commandLine);
   })
   .on("end", () => {
     console.log("Video with audio generated successfully");
     res.status(200).json({
       message: "Video generated successfully",
       video: path.basename(outputPath),
     });
   })
   .on("error", (err) => {
     console.error("Audio-video sync error:", err);
     res.status(500).json({ 
       message: "Error generating video", 
       error: err.message 
     });
   })
   .run();
 } catch (error) {
   console.error("Unexpected error:", error);
   res.status(500).json({ message: "An unexpected error occurred", error: error.message });
 }
});

module.exports = router;