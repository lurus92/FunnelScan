const analyzeBtn = document.getElementById("analyzeBtn");
const copyReportBtn = document.getElementById("copyReportBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
let latestReport = null;

function setStatus(lines) {
  statusEl.textContent = lines.join("\n");
}

function createLi(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

function formatIssue(issue) {
  if (!issue || typeof issue !== "object") {
    return "";
  }

  const title = issue.title || issue.issue || issue.problem || "";
  const impact = issue.impact || issue.severity || "";
  const suggestion = issue.suggestion || issue.fix || issue.recommendation || issue.comment || "";

  const titlePart = title ? title.trim() : "";
  const impactPart = impact ? ` (${String(impact).trim()})` : "";
  const suggestionPart = suggestion ? `: ${String(suggestion).trim()}` : "";

  return `${titlePart}${impactPart}${suggestionPart}`.trim();
}

function formatImprovement(item) {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return "";
  }

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

function formatActionItem(item) {
  if (!item || typeof item !== "object") return "";
  const priority = item.priority ? `P${item.priority}` : "P?";
  const task = item.task || item.title || "";
  const impact = item.expected_impact || item.impact || "";
  const effort = item.effort || "";
  const meta = [impact ? `impact: ${impact}` : "", effort ? `effort: ${effort}` : ""].filter(Boolean).join(", ");
  return `${priority} — ${task}${meta ? ` (${meta})` : ""}`;
}

analyzeBtn.addEventListener("click", async () => {
  const url = document.getElementById("url").value.trim();
  const persona = document.getElementById("persona").value.trim();

  if (!url) {
    setStatus(["Please provide a website URL."]);
    return;
  }

  analyzeBtn.disabled = true;
  resultEl.classList.add("hidden");

  setStatus(["Agent started...", "Fetching website...", "Analyzing..."]);

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, persona })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Unknown error");
    }

    document.getElementById("score").textContent = data.score;
    document.getElementById("summary").textContent = data.summary;

    const issuesEl = document.getElementById("issues");
    issuesEl.innerHTML = "";
    (data.issues || []).forEach((issue) => {
      const issueText = formatIssue(issue);
      if (issueText) {
        issuesEl.appendChild(createLi(issueText));
      }
    });

    const improvementsEl = document.getElementById("improvements");
    improvementsEl.innerHTML = "";
    (data.improvements || []).forEach((item) => {
      const improvementText = formatImprovement(item);
      if (improvementText) {
        improvementsEl.appendChild(createLi(improvementText));
      }
    });

    document.getElementById("headline").textContent = data.rewrite?.headline || "";
    document.getElementById("subheadline").textContent = data.rewrite?.subheadline || "";
    document.getElementById("cta").textContent = data.rewrite?.cta || "";
    document.getElementById("businessImpact").textContent = data.business_impact || "No business impact summary provided.";

    const actionPlanEl = document.getElementById("actionPlan");
    actionPlanEl.innerHTML = "";
    (data.action_plan || []).forEach((item) => {
      const actionText = formatActionItem(item);
      if (actionText) {
        actionPlanEl.appendChild(createLi(actionText));
      }
    });

    const logsEl = document.getElementById("logs");
    logsEl.innerHTML = "";
    (data.logs || []).forEach((log) => logsEl.appendChild(createLi(log)));

    latestReport = data;
    setStatus(data.logs?.length ? data.logs : ["Done."]);
    resultEl.classList.remove("hidden");
  } catch (error) {
    setStatus(["Agent started...", `Failed: ${error.message}`]);
    latestReport = null;
  } finally {
    analyzeBtn.disabled = false;
  }
});

copyReportBtn.addEventListener("click", async () => {
  if (!latestReport) {
    setStatus(["Run an analysis first, then copy the report."]);
    return;
  }

  try {
    const reportJson = JSON.stringify(latestReport, null, 2);
    await navigator.clipboard.writeText(reportJson);
    setStatus(["Report copied to clipboard."]);
  } catch (_error) {
    setStatus(["Could not copy to clipboard in this browser context."]);
  }
});
