const analyzeBtn    = document.getElementById("analyzeBtn");
const resultEl      = document.getElementById("result");
const scoreGaugeEl  = document.getElementById("scoreGauge");
const scoreLabelEl  = document.getElementById("scoreLabel");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const liveLogsPanel = document.getElementById("liveLogsPanel");
const liveLogsEl    = document.getElementById("liveLogs");
const logsSpinner   = document.getElementById("logsSpinner");

let latestApiResponse = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImpactLevel(impact) {
  const v = String(impact || "").toLowerCase();
  if (v.includes("high") || v.includes("critical")) return "high";
  if (v.includes("medium") || v.includes("moderate")) return "medium";
  return "low";
}

function formatIssue(issue) {
  if (!issue || typeof issue !== "object") return { title: "", impact: "" };
  return {
    title: issue.title || issue.issue || issue.problem || "Untitled issue",
    impact: issue.impact || issue.severity || "Low"
  };
}

function createIssueNode(issue) {
  const { title, impact } = formatIssue(issue);
  const level = getImpactLevel(impact);
  const borderColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

  const li = document.createElement("li");
  li.className = "issue-item";
  li.style.borderLeftColor = borderColors[level] || "#fca5a5";
  li.innerHTML = `
    <div class="issue-header">
      <span class="issue-title">${title}</span>
      <span class="impact-badge impact-${level}">${impact}</span>
    </div>
  `;
  return li;
}

function formatImprovement(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  return (
    item.text || item.suggestion || item.recommendation ||
    item.action || item.title || item.description ||
    Object.values(item).filter(v => typeof v === "string" && v.trim()).join(" — ")
  );
}

function updateGauge(score) {
  const pct = Math.round(Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0)));
  scoreGaugeEl.style.setProperty("--value", String(pct));

  let color = "var(--danger)";
  let label = "Needs Improvement";
  if (pct >= 75) { color = "var(--success)"; label = "Strong Conversion Foundation"; }
  else if (pct >= 50) { color = "var(--warning)"; label = "Promising With Gaps"; }

  scoreGaugeEl.style.setProperty("--gauge-color", color);
  scoreLabelEl.textContent = label;
}

// ── Live logs ─────────────────────────────────────────────────────────────────

function appendLog(message) {
  const li = document.createElement("li");
  li.textContent = message;
  liveLogsEl.appendChild(li);
  liveLogsPanel.scrollTop = liveLogsPanel.scrollHeight;
}

// ── Funnel Visualization ──────────────────────────────────────────────────────

const STEP_ICONS = { landing: "🏠", product: "📦", pricing: "💰", signup: "✏️", checkout: "🛒" };

function scoreToColor(score) {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function renderFunnelCanvas(steps) {
  const canvas = document.getElementById("funnelCanvas");
  canvas.innerHTML = "";

  (steps || []).forEach((step, index) => {
    // Width = how many users are *entering* this step
    // Step 1 always 100%; subsequent steps use the previous step's retainedProbability
    const entryRetained = index === 0 ? 1 : (Number(steps[index - 1].retainedProbability) || 1);
    const widthPct = Math.round(Math.max(28, entryRetained * 100));

    const exitPct  = Math.round((Number(step.estimatedExitRate) || 0) * 100);
    const score    = Number(step.pageScore) || 0;
    const fnColor  = scoreToColor(score);

    const painHtml = (step.painPoints || [])
      .slice(0, 3)
      .map(p => {
        const lvl = (p.impact || "low").toLowerCase();
        return `<li class="fn-pain fn-pain-${lvl}">${p.title}</li>`;
      })
      .join("");

    // Stagger the animation
    const delay = `${index * 90}ms`;

    const wrap = document.createElement("div");
    wrap.className = "funnel-node-wrap";
    wrap.style.width = `${widthPct}%`;
    wrap.style.animationDelay = delay;
    wrap.innerHTML = `
      <div class="funnel-node" style="--fn-color:${fnColor}">
        <div class="fn-header">
          <span class="fn-step-badge">${STEP_ICONS[step.stepType] || "📄"} Step ${step.step} · ${step.stepType || "page"}</span>
          <span class="fn-score" style="color:${fnColor}">Score ${score}/100</span>
        </div>
        <div class="fn-url">${step.url || ""}</div>
        ${step.title ? `<div class="fn-title">${step.title}</div>` : ""}
        ${painHtml ? `<ul class="fn-pain-list">${painHtml}</ul>` : ""}
      </div>
    `;
    canvas.appendChild(wrap);

    if (index < steps.length - 1) {
      const connector = document.createElement("div");
      connector.className = "funnel-connector";
      connector.style.animationDelay = `${index * 90 + 45}ms`;
      connector.innerHTML = `
        <div class="fn-connector-line"></div>
        <div class="fn-drop-label">↓ ${exitPct}% exit at this step</div>
        <div class="fn-connector-line"></div>
      `;
      canvas.appendChild(connector);
    }
  });
}

// ── Download ──────────────────────────────────────────────────────────────────

function downloadLatestJson() {
  if (!latestApiResponse) return;
  const blob = new Blob([JSON.stringify(latestApiResponse, null, 2)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = objectUrl;
  a.download = `funnelscan-report-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

downloadJsonBtn.addEventListener("click", downloadLatestJson);

// ── Render results ────────────────────────────────────────────────────────────

function renderResults(data) {
  const score = Number(data.score) || 0;
  document.getElementById("score").textContent = score;
  updateGauge(score);
  document.getElementById("summary").textContent = data.summary || "";

  const issuesEl = document.getElementById("issues");
  issuesEl.innerHTML = "";
  (data.issues || []).forEach(issue => issuesEl.appendChild(createIssueNode(issue)));

  const improvementsEl = document.getElementById("improvements");
  improvementsEl.innerHTML = "";
  (data.improvements || []).forEach(item => {
    const text = formatImprovement(item);
    if (!text) return;
    const li = document.createElement("li");
    li.textContent = text;
    improvementsEl.appendChild(li);
  });

  document.getElementById("headline").textContent   = data.rewrite?.headline    || "—";
  document.getElementById("subheadline").textContent = data.rewrite?.subheadline || "—";
  document.getElementById("cta").textContent         = data.rewrite?.cta         || "—";

  const finalProb    = Number(data?.funnel?.finalConversionProbability);
  const totalExit    = Number(data?.funnel?.totalEstimatedExitRate);
  const selectedDepth = Number(data?.input?.depth || data?.funnel?.requestedDepth);

  document.getElementById("funnelDepthLabel").textContent = Number.isFinite(selectedDepth)
    ? `${selectedDepth} pages analyzed` : "—";
  document.getElementById("conversionProb").textContent = Number.isFinite(finalProb)
    ? `${finalProb}% conversion` : "—";
  document.getElementById("totalExitRate").textContent = Number.isFinite(totalExit)
    ? `${totalExit}% exit` : "—";

  renderFunnelCanvas(data?.funnel?.steps || []);

  resultEl.classList.remove("hidden");
  resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Main flow ─────────────────────────────────────────────────────────────────

analyzeBtn.addEventListener("click", () => {
  const url     = document.getElementById("url").value.trim();
  const persona = document.getElementById("persona").value.trim();
  const depth   = Number(document.getElementById("depth").value) || 3;

  if (!url) {
    liveLogsPanel.classList.remove("hidden");
    appendLog("Please provide a website URL.");
    return;
  }

  // Reset
  analyzeBtn.disabled = true;
  downloadJsonBtn.disabled = true;
  latestApiResponse = null;
  resultEl.classList.add("hidden");
  liveLogsEl.innerHTML = "";
  liveLogsPanel.classList.remove("hidden");
  logsSpinner.classList.remove("done");

  const params = new URLSearchParams({ url, persona: persona || "General website visitor", depth });
  const es = new EventSource(`/analyze/stream?${params}`);

  es.addEventListener("log", (e) => {
    const { message } = JSON.parse(e.data);
    appendLog(message);
  });

  es.addEventListener("result", (e) => {
    const data = JSON.parse(e.data);
    latestApiResponse = data;
    downloadJsonBtn.disabled = false;
    logsSpinner.classList.add("done");
    es.close();
    analyzeBtn.disabled = false;
    renderResults(data);
  });

  es.addEventListener("failure", (e) => {
    try {
      const { message } = JSON.parse(e.data);
      appendLog(`Error: ${message}`);
    } catch {
      appendLog("Analysis failed. Please try again.");
    }
    logsSpinner.classList.add("done");
    analyzeBtn.disabled = false;
    es.close();
  });

  es.addEventListener("error", () => {
    appendLog("Connection error. Please try again.");
    logsSpinner.classList.add("done");
    analyzeBtn.disabled = false;
    es.close();
  });
});
