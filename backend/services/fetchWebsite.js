const { cleanHtml } = require("../utils/cleanHtml");

function extractLinks(html, baseUrl) {
  if (!html || typeof html !== "string") return [];

  const seen = new Set();
  const links = [];
  const hrefRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawHref = match[1]?.trim();
    if (!rawHref) continue;

    let absolute;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }

    if (!absolute.startsWith("http")) continue;
    if (seen.has(absolute)) continue;

    const anchorText = cleanHtml(match[2] || "").slice(0, 120);
    seen.add(absolute);
    links.push({ href: absolute, text: anchorText || absolute });
  }

  return links;
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch?.[1]) return "";
  return cleanHtml(titleMatch[1]).slice(0, 160);
}

async function fetchWebsite(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FunnelScanBot/0.2 (+https://example.local)"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch website: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const text = cleanHtml(html);

  if (!text) {
    throw new Error("Fetched page had no readable text content.");
  }

  return {
    url,
    title: extractTitle(html),
    text,
    links: extractLinks(html, url)
  };
}

module.exports = { fetchWebsite };
