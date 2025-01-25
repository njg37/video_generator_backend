const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const router = express.Router();
require("dotenv").config(); // Ensure you have dotenv configured for environment variables

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Ensure all required environment variables are available
if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Missing Spotify environment variables.");
  process.exit(1); // Exit if critical environment variables are missing
}

// Route: Spotify Authentication - Login
router.get("/login", (req, res) => {
  const scope = "user-read-private user-read-email playlist-read-private";
  const query = querystring.stringify({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  console.log("Redirecting to Spotify login with query:", query);
  res.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

// Route: Spotify Callback for Token Exchange
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    console.error("No authorization code provided in callback.");
    return res.status(400).send("Authorization code is missing.");
  }

  console.log("Authorization code received:", code);

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

    console.log("Spotify token exchange response:", response.data);

    const { access_token, refresh_token } = response.data;

    // For development/debugging: Send the tokens as JSON response
    // In production: Consider securely storing these tokens
    res.json({ access_token, refresh_token });
  } catch (error) {
    console.error(
      "Error during Spotify token exchange:",
      error.response?.data || error.message
    );
    res.status(400).send("Spotify authentication failed.");
  }
});

// Route: Spotify Token Refresh
router.get("/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;

  if (!refresh_token) {
    console.error("No refresh token provided.");
    return res.status(400).send("Refresh token is missing.");
  }

  console.log("Refreshing token with refresh_token:", refresh_token);

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

    console.log("Spotify token refresh response:", response.data);

    const { access_token } = response.data;

    res.json({ access_token });
  } catch (error) {
    console.error(
      "Error during Spotify token refresh:",
      error.response?.data || error.message
    );
    res.status(400).send("Failed to refresh Spotify token.");
  }
});

module.exports = router;
