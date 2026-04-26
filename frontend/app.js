const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const scoreGaugeEl = document.getElementById("scoreGauge");
const scoreLabelEl = document.getElementById("scoreLabel");
const deferredCards = Array.from(document.querySelectorAll(".deferred-card"));

function setStatus(lines) {
  statusEl.textContent = lines.join("\n");
}

function createLi(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

function getImpactLevel(impact) {
  const value = String(impact || "").toLowerCase();

  if (value.includes("high") || value.includes("critical") || value.includes("severe")) {
    return "high";
  }

  if (value.includes("medium") || value.includes("moderate")) {
    return "medium";
  }

  return "low";
}

function formatIssue(issue) {
  if (!issue || typeof issue !== "object") {
    return { title: "", impact: "" };
  }

  return {
    title: issue.title || issue.issue || issue.problem || "Untitled issue",
    impact: issue.impact || issue.severity || "Low"
  };
}

function createIssueNode(issue) {
  const { title, impact } = formatIssue(issue);
  const impactLevel = getImpactLevel(impact);

  const item = document.createElement("li");
  item.className = "issue-item";
  const colorMap = {
    high: "#ef4444",
    medium: "#f87171",
    low: "#fca5a5"
  };
  item.style.borderLeftColor = colorMap[impactLevel] || "#f87171";

  item.innerHTML = `
    <div class="issue-header">
      <span class="issue-title">${title}</span>
      <span class="impact-badge impact-${impactLevel}">${impact}</span>
    </div>
  `;

  return item;
}

function formatImprovement(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";

  return (
    item.text ||
    item.suggestion ||
    item.recommendation ||
    item.action ||
    item.title ||
    item.description ||
    Object.values(item)
      .filter((value) => typeof value === "string" && value.trim())
      .join(" — ")
  );
}

function updateGauge(score) {
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const scorePct = Math.round(normalizedScore);

  scoreGaugeEl.style.setProperty("--value", String(scorePct));

  let color = "var(--danger)";
  let label = "Needs Improvement";

  if (scorePct >= 75) {
    color = "var(--success)";
    label = "Strong Conversion Foundation";
  } else if (scorePct >= 50) {
    color = "var(--warning)";
    label = "Promising With Gaps";
  }

  scoreGaugeEl.style.setProperty("--gauge-color", color);
  scoreLabelEl.textContent = label;
}

function setDeferredVisibility(visible) {
  deferredCards.forEach((card) => {
    card.classList.toggle("hidden", !visible);
  });
}

function renderFunnelSteps(steps) {
  const listEl = document.getElementById("funnelSteps");
  listEl.innerHTML = "";

  (steps || []).forEach((step) => {
    const item = document.createElement("li");
    item.className = "funnel-step";
    const exitPct = Math.round((Number(step.estimatedExitRate) || 0) * 100);

    const issues = (step.painPoints || []).map((point) => point.title).join(" • ") || "No issues detected";

    item.innerHTML = `
      <div class="row">
        <strong>Step ${step.step}: ${step.stepType || "page"}</strong>
        <span>Exit ${exitPct}%</span>
      </div>
      <div class="row">
        <span>${step.url || ""}</span>
      </div>
      <div class="row issue-row">
        <span>${issues}</span>
      </div>
      <div class="funnel-bar"><span style="width:${exitPct}%;"></span></div>
    `;

    listEl.appendChild(item);
  });
}

setDeferredVisibility(false);

analyzeBtn.addEventListener("click", async () => {
  const url = document.getElementById("url").value.trim();
  const persona = document.getElementById("persona").value.trim();
  const depth = Number(document.getElementById("depth").value) || 3;

  if (!url) {
    setStatus(["Please provide a website URL."]);
    return;
  }

  analyzeBtn.disabled = true;
  resultEl.classList.add("hidden");
  setDeferredVisibility(false);

  setStatus(["Agent started...", "Traversing funnel pages...", "Analyzing..."]);

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, persona, depth })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Unknown error");
    }

    const score = Number(data.score) || 0;
    document.getElementById("score").textContent = score;
    updateGauge(score);
    document.getElementById("summary").textContent = data.summary;

    const issuesEl = document.getElementById("issues");
    issuesEl.innerHTML = "";
    (data.issues || []).forEach((issue) => issuesEl.appendChild(createIssueNode(issue)));

    const improvementsEl = document.getElementById("improvements");
    improvementsEl.innerHTML = "";
    (data.improvements || []).forEach((item) => {
      const improvementText = formatImprovement(item);
      if (improvementText) improvementsEl.appendChild(createLi(improvementText));
    });

    document.getElementById("headline").textContent = data.rewrite?.headline || "—";
    document.getElementById("subheadline").textContent = data.rewrite?.subheadline || "—";
    document.getElementById("cta").textContent = data.rewrite?.cta || "—";

    const finalProb = Number(data?.funnel?.finalConversionProbability);
    const totalExitRate = Number(data?.funnel?.totalEstimatedExitRate);
    const selectedDepth = Number(data?.input?.depth || data?.funnel?.requestedDepth);
    document.getElementById("funnelDepthLabel").textContent = Number.isFinite(selectedDepth)
      ? `Selected funnel depth: ${selectedDepth} page(s)`
      : "Selected funnel depth: —";
    document.getElementById("conversionProb").textContent = Number.isFinite(finalProb)
      ? `Final conversion probability: ${finalProb}%`
      : "Final conversion probability: —";
    document.getElementById("totalExitRate").textContent = Number.isFinite(totalExitRate)
      ? `Total estimated exit rate: ${totalExitRate}%`
      : "Total estimated exit rate: —";
    renderFunnelSteps(data?.funnel?.steps || []);

    const logsEl = document.getElementById("logs");
    logsEl.innerHTML = "";
    (data.logs || []).forEach((log) => logsEl.appendChild(createLi(log)));

    setStatus(data.logs?.length ? data.logs : ["Done."]);
    resultEl.classList.remove("hidden");
    setDeferredVisibility(true);
  } catch (error) {
    setStatus(["Agent started...", `Failed: ${error.message}`]);
  } finally {
    analyzeBtn.disabled = false;
  }
});
