import express from "express";
import { addonBuilder } from "stremio-addon-sdk";

const PORT = process.env.PORT || 3000;
const app = express();

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

const addonInterface = builder.getInterface();

// Serve the manifest.json
app.get("/manifest.json", (req, res) => {
    res.json(addonInterface.manifest);
});

// Serve the subtitles handler (optional, adjust as needed)
app.get("/subtitles/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const subtitles = await addonInterface.subtitles({ type, id });
    res.json(subtitles);
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`✅ Stremio OpenSubtitles Add-on is running on port ${PORT}`);
});
