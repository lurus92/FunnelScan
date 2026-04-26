const express = require("express");
const { fetchWebsite } = require("../services/fetchWebsite");
const { analyzeWithLLM } = require("../services/analyzeWithLLM");

const router = express.Router();

router.post("/analyze", async (req, res) => {
  const { url, persona } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid 'url' is required." });
  }

  const normalizedPersona = typeof persona === "string" && persona.trim() ? persona.trim() : "General website visitor";
  const logs = ["Agent started...", `Simulating user persona: ${normalizedPersona}...`];

  try {
    let websiteText;

    logs.push("Fetching website content...");
    try {
      websiteText = await fetchWebsite(url);
      logs.push("Website content fetched successfully.");
    } catch (fetchError) {
      logs.push(`Fetch warning: ${fetchError.message}`);
      logs.push("Continuing with limited synthetic page context...");
      websiteText = `Homepage content could not be fetched directly. Analyze likely conversion friction for this website URL: ${url}`;
    }

    logs.push("Analyzing UX and conversion flow...");
    const report = await analyzeWithLLM({
      persona: normalizedPersona,
      websiteText,
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
    });

    logs.push("Generating final report...");

    return res.json({
      ...report,
      logs
    });
  } catch (error) {
    logs.push(`Agent failed: ${error.message}`);
    return res.status(500).json({
      error: "Analysis failed",
      message: error.message,
      logs
    });
  }
});

module.exports = router;
