const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const uploadRoutes = require("./routes/upload");
const themeRoutes = require("./routes/theme");
const generateRoutes = require("./routes/generate");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("uploads")); // Serve static files from uploads folder

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/theme", themeRoutes);
app.use("/api/generate", generateRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
