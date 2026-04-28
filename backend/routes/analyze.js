const express = require("express");
const { fetchWebsite } = require("../services/fetchWebsite");
const { analyzeWithLLM, chooseTopLinks } = require("../services/analyzeWithLLM");

const router = express.Router();

// Shared traversal logic — returns pages array and logs array, emitting each log via onLog callback
async function traverseFunnel(url, persona, requestedDepth, onLog) {
  const logs = [];
  const log = (msg) => { logs.push(msg); onLog(msg); };

  log("Agent started...");
  log(`Simulating user persona: ${persona}...`);
  log(`Requested funnel depth: ${requestedDepth} page(s).`);

  const visited = new Set();
  const pages = [];
  let currentUrl = url;

  for (let step = 1; step <= requestedDepth; step++) {
    if (!currentUrl || visited.has(currentUrl)) {
      log(`Step ${step}: no eligible next page found. Stopping traversal.`);
      break;
    }

    log(`Step ${step}: analyzing page ${currentUrl}`);
    log(`Step ${step}: fetching HTML for ${currentUrl}`);

    let page;
    try {
      page = await fetchWebsite(currentUrl);
    } catch (fetchError) {
      log(`Step ${step}: fetch warning (${fetchError.message}).`);
      page = {
        url: currentUrl,
        title: `Step ${step}`,
        text: `Could not fetch live page content for ${currentUrl}. Infer likely conversion friction for this step in the funnel.`,
        links: []
      };
      log(`Step ${step}: using synthetic page context.`);
    }

    visited.add(currentUrl);
    pages.push(page);
    log(`Step ${step}: extracted content and discovered ${page.links.length} candidate link(s).`);

    const rankedLinks = chooseTopLinks(page.links, currentUrl, visited);
    const next = rankedLinks[0];

    if (!next) {
      log(`Step ${step}: no high-intent internal link found. Traversal complete.`);
      break;
    }

    currentUrl = next.href;
    log(`Step ${step}: next best step selected -> ${currentUrl}`);
  }

  return { pages, logs };
}

// POST /analyze — REST endpoint (used by API consumers)
router.post("/analyze", async (req, res) => {
  const { url, persona, depth } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid 'url' is required." });
  }

  const normalizedPersona = typeof persona === "string" && persona.trim() ? persona.trim() : "General website visitor";
  const requestedDepth = Math.max(1, Math.min(8, Number(depth) || 3));

  try {
    const { pages, logs } = await traverseFunnel(url, normalizedPersona, requestedDepth, () => {});

    if (!pages.length) throw new Error("No pages were fetched successfully.");

    logs.push("Aggregating funnel pain points and conversion estimates...");
    const report = await analyzeWithLLM({
      persona: normalizedPersona,
      pages,
      requestedDepth,
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
    });
    logs.push("Generating final funnel report...");

    return res.json({ ...report, input: { url, persona: normalizedPersona, depth: requestedDepth }, logs });
  } catch (error) {
    return res.status(500).json({ error: "Analysis failed", message: error.message });
  }
});

// GET /analyze/stream — SSE endpoint (used by the UI)
router.get("/analyze/stream", async (req, res) => {
  const { url, persona, depth } = req.query || {};

  if (!url || typeof url !== "string") {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: "A valid 'url' is required." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let closed = false;
  req.on("close", () => { closed = true; });

  const emit = (event, data) => {
    if (closed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === "function") res.flush();
  };

  const normalizedPersona = typeof persona === "string" && persona.trim() ? persona.trim() : "General website visitor";
  const requestedDepth = Math.max(1, Math.min(8, Number(depth) || 3));

  try {
    const { pages, logs } = await traverseFunnel(
      url,
      normalizedPersona,
      requestedDepth,
      (msg) => emit("log", { message: msg })
    );

    if (closed) return;
    if (!pages.length) throw new Error("No pages were fetched successfully.");

    emit("log", { message: "Aggregating funnel data..." });
    emit("log", { message: "Calling AI analysis — this may take a moment..." });
    logs.push("Aggregating funnel data...");
    logs.push("Calling AI analysis — this may take a moment...");

    const report = await analyzeWithLLM({
      persona: normalizedPersona,
      pages,
      requestedDepth,
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
    });

    if (closed) return;
    emit("log", { message: "Generating final funnel report..." });
    logs.push("Generating final funnel report...");

    emit("result", { ...report, input: { url, persona: normalizedPersona, depth: requestedDepth }, logs });
  } catch (error) {
    emit("log", { message: `Agent failed: ${error.message}` });
    emit("failure", { message: error.message });
  }
});

module.exports = router;
