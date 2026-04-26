const express = require("express");
const { fetchWebsite } = require("../services/fetchWebsite");
const { analyzeWithLLM, chooseTopLinks } = require("../services/analyzeWithLLM");

const router = express.Router();

router.post("/analyze", async (req, res) => {
  const { url, persona, depth } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid 'url' is required." });
  }

  const normalizedPersona = typeof persona === "string" && persona.trim() ? persona.trim() : "General website visitor";
  const requestedDepth = Math.max(1, Math.min(8, Number(depth) || 3));
  const logs = [
    "Agent started...",
    `Simulating user persona: ${normalizedPersona}...`,
    `Requested funnel depth: ${requestedDepth} page(s).`
  ];

  try {
    const visited = new Set();
    const pages = [];
    let currentUrl = url;

    for (let step = 1; step <= requestedDepth; step += 1) {
      if (!currentUrl || visited.has(currentUrl)) {
        logs.push(`Step ${step}: no eligible next page found. Stopping traversal.`);
        break;
      }

      logs.push(`Step ${step}: analyzing page ${currentUrl}`);
      logs.push(`Step ${step}: fetching HTML for ${currentUrl}`);

      let page;
      try {
        page = await fetchWebsite(currentUrl);
      } catch (fetchError) {
        logs.push(`Step ${step}: fetch warning (${fetchError.message}).`);
        page = {
          url: currentUrl,
          title: `Step ${step}`,
          text: `Could not fetch live page content for ${currentUrl}. Infer likely conversion friction for this step in the funnel.`,
          links: []
        };
        logs.push(`Step ${step}: using synthetic page context.`);
      }

      visited.add(currentUrl);
      pages.push(page);
      logs.push(`Step ${step}: extracted content and discovered ${page.links.length} candidate link(s).`);

      const rankedLinks = chooseTopLinks(page.links, currentUrl, visited);
      const next = rankedLinks[0];

      if (!next) {
        logs.push(`Step ${step}: no high-intent internal link found. Traversal complete.`);
        break;
      }

      currentUrl = next.href;
      logs.push(`Step ${step}: next best step selected -> ${currentUrl}`);
    }

    if (!pages.length) {
      throw new Error("No pages were fetched successfully.");
    }

    logs.push("Aggregating funnel pain points and conversion estimates...");
    const report = await analyzeWithLLM({
      persona: normalizedPersona,
      pages,
      requestedDepth,
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
    });

    logs.push("Generating final funnel report...");

    return res.json({
      ...report,
      input: {
        url,
        persona: normalizedPersona,
        depth: requestedDepth
      },
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
