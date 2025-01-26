const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import your existing routes
const uploadRoutes = require("./routes/upload");
const themeRoutes = require("./routes/theme");
const generateRoutes = require("./routes/generate");
const spotifyRoutes = require("./routes/spotify"); // Spotify Routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads"))); // Serve static files from the "uploads" folder

// // Add comprehensive CORS configuration
// app.use(cors({
//   origin: ['http://localhost:3000'],
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// Use the routes
app.use("/api/upload", uploadRoutes);
app.use("/api/theme", themeRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/spotify", spotifyRoutes); // Spotify Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Catch-all Route (Serve Frontend in Production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
  });
}

// Error Handling Middleware (Optional)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
