const analyzeBtn      = document.getElementById("analyzeBtn");
const resultEl        = document.getElementById("result");
const scoreGaugeEl    = document.getElementById("scoreGauge");
const scoreLabelEl    = document.getElementById("scoreLabel");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const stepperEl       = document.getElementById("progressStepper");

let latestApiResponse = null;

// ── Stepper ───────────────────────────────────────────────────────────────────

const STEPS = ["crawl", "persona", "analyze", "report"];
let currentStepIdx = -1;

function stepEl(id)  { return document.getElementById(`step-${id}`); }
function connEl(n)   { return document.getElementById(`conn-${n}`); }

function setState(id, state) {
  const el = stepEl(id);
  if (el) el.dataset.state = state;
}

function advanceTo(idx) {
  if (idx <= currentStepIdx) return;
  for (let i = Math.max(0, currentStepIdx); i < idx; i++) {
    setState(STEPS[i], "done");
    const c = connEl(i + 1);
    if (c) c.classList.add("done");
  }
  currentStepIdx = idx;
  if (idx < STEPS.length) setState(STEPS[idx], "active");
}

function initStepper(persona) {
  currentStepIdx = -1;
  STEPS.forEach(id => setState(id, "pending"));
  document.querySelectorAll(".step-conn").forEach(c => c.classList.remove("done"));
  document.getElementById("sub-persona").textContent = persona || "General visitor";
  stepperEl.classList.remove("hidden", "fading-out");
  advanceTo(0);
}

function handleLogStep(message) {
  const m = message.toLowerCase();
  // Update crawl subtitle with the URL being fetched
  if (m.includes("fetching html for ")) {
    const url = message.replace(/.*fetching html for /i, "").trim();
    document.getElementById("sub-crawl").textContent =
      url.length > 48 ? url.slice(0, 48) + "…" : url;
  }
  // Step transitions
  if (m.includes("aggregating"))        advanceTo(1);
  if (m.includes("calling ai analysis")) advanceTo(2);
  if (m.includes("generating final"))   advanceTo(3);
}

function completeStepper() {
  // Tick the last step done immediately
  STEPS.forEach((id, i) => {
    setState(id, "done");
    const c = connEl(i + 1);
    if (c) c.classList.add("done");
  });
  // Brief pause so the user sees all green, then fade out
  setTimeout(() => {
    stepperEl.classList.add("fading-out");
    setTimeout(() => stepperEl.classList.add("hidden"), 450);
  }, 700);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImpactLevel(impact) {
  const v = String(impact || "").toLowerCase();
  if (v.includes("high") || v.includes("critical")) return "high";
  if (v.includes("medium") || v.includes("moderate")) return "medium";
  return "low";
}

function createIssueNode(issue) {
  if (!issue || typeof issue !== "object") return null;
  const title  = issue.title || issue.issue || issue.problem || "Untitled issue";
  const impact = issue.impact || issue.severity || "Low";
  const desc   = issue.description || issue.suggestion || "";
  const level  = getImpactLevel(impact);
  const borderColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

  const li = document.createElement("li");
  li.className = "issue-item";
  li.style.borderLeftColor = borderColors[level] || "#fca5a5";
  li.innerHTML = `
    <div class="issue-header">
      <span class="issue-title">${title}</span>
      <span class="impact-badge impact-${level}">${impact}</span>
    </div>
    ${desc ? `<p class="issue-desc">${desc}</p>` : ""}
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
    const entryRetained = index === 0 ? 1 : (Number(steps[index - 1].retainedProbability) || 1);
    const widthPct = Math.round(Math.max(28, entryRetained * 100));
    const exitPct  = Math.round((Number(step.estimatedExitRate) || 0) * 100);
    const score    = Number(step.pageScore) || 0;
    const fnColor  = scoreToColor(score);

    const painHtml = (step.painPoints || [])
      .slice(0, 3)
      .map(p => `<li class="fn-pain fn-pain-${(p.impact || "low").toLowerCase()}">${p.title}</li>`)
      .join("");

    const wrap = document.createElement("div");
    wrap.className = "funnel-node-wrap";
    wrap.style.width = `${widthPct}%`;
    wrap.style.animationDelay = `${index * 90}ms`;
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
  (data.issues || []).forEach(issue => {
    const node = createIssueNode(issue);
    if (node) issuesEl.appendChild(node);
  });

  const improvementsEl = document.getElementById("improvements");
  improvementsEl.innerHTML = "";
  (data.improvements || []).forEach(item => {
    const text = formatImprovement(item);
    if (!text) return;
    const li = document.createElement("li");
    li.textContent = text;
    improvementsEl.appendChild(li);
  });

  document.getElementById("headline").textContent    = data.rewrite?.headline    || "—";
  document.getElementById("subheadline").textContent = data.rewrite?.subheadline || "—";
  document.getElementById("cta").textContent         = data.rewrite?.cta         || "—";

  const finalProb     = Number(data?.funnel?.finalConversionProbability);
  const totalExit     = Number(data?.funnel?.totalEstimatedExitRate);
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
  const persona = document.getElementById("persona").value.trim() || "General website visitor";
  const depth   = Number(document.getElementById("depth").value) || 3;

  if (!url) {
    alert("Please provide a website URL.");
    return;
  }

  analyzeBtn.disabled = true;
  downloadJsonBtn.disabled = true;
  latestApiResponse = null;
  resultEl.classList.add("hidden");

  initStepper(persona);

  const params = new URLSearchParams({ url, persona, depth });
  const es = new EventSource(`/analyze/stream?${params}`);

  es.addEventListener("log", (e) => {
    const { message } = JSON.parse(e.data);
    handleLogStep(message);
  });

  es.addEventListener("result", (e) => {
    const data = JSON.parse(e.data);
    latestApiResponse = data;
    downloadJsonBtn.disabled = false;
    completeStepper();
    es.close();
    analyzeBtn.disabled = false;
    // Wait for stepper to finish fading out before revealing results
    setTimeout(() => renderResults(data), 1200);
  });

  es.addEventListener("failure", (e) => {
    try {
      const { message } = JSON.parse(e.data);
      alert(`Analysis failed: ${message}`);
    } catch {
      alert("Analysis failed. Please try again.");
    }
    stepperEl.classList.add("hidden");
    analyzeBtn.disabled = false;
    es.close();
  });

  es.addEventListener("error", () => {
    alert("Connection error. Please try again.");
    stepperEl.classList.add("hidden");
    analyzeBtn.disabled = false;
    es.close();
  });
});
