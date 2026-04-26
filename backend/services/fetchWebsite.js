const { cleanHtml } = require("../utils/cleanHtml");

async function fetchWebsite(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FunnelScanBot/0.1 (+https://example.local)"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch website: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const cleaned = cleanHtml(html);

  if (!cleaned) {
    throw new Error("Fetched page had no readable text content.");
  }

  return cleaned;
}

module.exports = { fetchWebsite };
