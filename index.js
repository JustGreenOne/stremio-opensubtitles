import express from "express";
import { addonBuilder } from "stremio-addon-sdk";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// OpenSubtitles API Key (set in Railway environment variables)
const OPEN_SUBTITLES_API_KEY = process.env.OPEN_SUBTITLES_API_KEY || "YOUR_API_KEY";

const builder = new addonBuilder({
    id: "org.stremio.opensubtitles.auto",
    version: "1.0.1",
    name: "OpenSubtitles Auto",
    description: "Fetches subtitles in your Stremio preferred language from OpenSubtitles.",
    resources: ["subtitles"],
    types: ["movie", "series"],
    catalogs: [],
    idPrefixes: ["tt"],
    behaviorHints: { configurable: false }
});

// ✅ **Define the subtitles handler** (Fixes the error!)
builder.defineSubtitlesHandler(async (args) => {
    const { type, id, extra } = args;
    const imdbId = id.replace("tt", ""); // Extract IMDb ID

    // Use Stremio preferred subtitle language, default to Hebrew
    const preferredLang = extra?.preferredSubtitles || "he";

    console.log(`Fetching subtitles for IMDb ID: ${imdbId} in language: ${preferredLang}`);

    try {
        const response = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId}&languages=${preferredLang}`, {
            headers: {
                "Api-Key": OPEN_SUBTITLES_API_KEY,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.log(`No subtitles found for ${preferredLang}.`);
            return { subtitles: [] };
        }

        // Convert OpenSubtitles response to Stremio format
        const subtitles = data.data.map(sub => ({
            id: sub.id,
            lang: preferredLang,
            url: sub.attributes.url
        }));

        console.log(`Subtitles found: ${subtitles.length}`);
        return { subtitles };
    } catch (error) {
        console.error("Error fetching subtitles:", error);
        return { subtitles: [] };
    }
});

// Get Stremio addon interface
const addonInterface = builder.getInterface();

// Serve the manifest.json (Stremio requires this)
app.get("/manifest.json", (req, res) => {
    res.json(addonInterface.manifest);
});

// Start the Express server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Stremio OpenSubtitles Add-on is running on port ${PORT}`);
});
