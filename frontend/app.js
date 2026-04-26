const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

function setStatus(lines) {
  statusEl.textContent = lines.join("\n");
}

function createLi(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
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
      issuesEl.appendChild(createLi(`${issue.title} (${issue.impact}): ${issue.suggestion}`));
    });

    const improvementsEl = document.getElementById("improvements");
    improvementsEl.innerHTML = "";
    (data.improvements || []).forEach((item) => {
      improvementsEl.appendChild(createLi(item));
    });

    document.getElementById("headline").textContent = data.rewrite?.headline || "";
    document.getElementById("subheadline").textContent = data.rewrite?.subheadline || "";
    document.getElementById("cta").textContent = data.rewrite?.cta || "";

    const logsEl = document.getElementById("logs");
    logsEl.innerHTML = "";
    (data.logs || []).forEach((log) => logsEl.appendChild(createLi(log)));

    setStatus(data.logs?.length ? data.logs : ["Done."]);
    resultEl.classList.remove("hidden");
  } catch (error) {
    setStatus(["Agent started...", `Failed: ${error.message}`]);
  } finally {
    analyzeBtn.disabled = false;
  }
});
