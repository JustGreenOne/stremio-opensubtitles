import http from "http";
import { addonBuilder } from "stremio-addon-sdk";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OPEN_SUBTITLES_API_KEY = process.env.OPEN_SUBTITLES_API_KEY || "YOUR_API_KEY";

const builder = new addonBuilder({
    id: "org.stremio.opensubtitles.auto",
    version: "1.0.1",
    name: "OpenSubtitles Auto",
    description: "Fetches subtitles in your Stremio preferred language from OpenSubtitles.",
    resources: ["subtitles"],
    types: ["movie", "series"],
    catalogs: [], // Fix: Added empty catalogs array
    idPrefixes: ["tt"], // IMDb ID format
    behaviorHints: {
        configurable: false
    }
});

builder.defineSubtitlesHandler(async (args) => {
    const { type, id, extra } = args;
    const imdbId = id.replace("tt", "");

    // Get user's preferred subtitle language from Stremio settings (fallback to Hebrew)
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

// ✅ FIX: Call getInterface() once and store the result
const addonInterface = builder.getInterface();

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/manifest.json") {
        res.end(JSON.stringify(addonInterface.manifest));
    } else {
        res.end(JSON.stringify({ error: "Invalid request" }));
    }
}).listen(PORT, "::", () => {  // ✅ FIX: Listen on "::" instead of "0.0.0.0" or "::1"
    console.log(`✅ Stremio OpenSubtitles Add-on is running on port ${PORT}`);
});
