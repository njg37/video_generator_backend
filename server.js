const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const querystring = require("querystring");
const axios = require("axios");
const path = require("path");

// Import your existing routes
const uploadRoutes = require("./routes/upload");
const themeRoutes = require("./routes/theme");
const generateRoutes = require("./routes/generate");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads"))); // Serve static files from uploads folder

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Route: Spotify Authentication - Login
app.get("/api/spotify/login", (req, res) => {
  const scope = "user-read-private user-read-email playlist-read-private";
  const query = querystring.stringify({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  console.log("Spotify login query:", query); // Debugging log for Spotify login request

  res.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

// Route: Spotify Callback for Token Exchange
app.get("/api/spotify/callback", async (req, res) => {
  const code = req.query.code || null;

  console.log("Spotify callback received with code:", code); // Log the code received

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Spotify token response:", response.data); // Log the response from token exchange

    const { access_token, refresh_token } = response.data;
    res.json({ access_token, refresh_token });
  } catch (error) {
    console.error("Error during Spotify authentication:", error.response?.data || error.message);
    res.status(400).send("Spotify authentication failed");
  }
});

// Route: Spotify Token Refresh (Optional)
app.get("/api/spotify/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Spotify token refresh response:", response.data); // Log the response from token refresh

    const { access_token } = response.data;
    res.json({ access_token });
  } catch (error) {
    console.error("Error refreshing Spotify token:", error.response?.data || error.message);
    res.status(400).send("Failed to refresh Spotify token");
  }
});

// Use the existing routes
app.use("/api/upload", uploadRoutes);
app.use("/api/theme", themeRoutes);
app.use("/api/generate", generateRoutes);

// Catch-all Route (Optional: Serve Frontend in Production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
