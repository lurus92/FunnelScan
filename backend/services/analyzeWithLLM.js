function buildPrompt({ persona, websiteText }) {
  return `You are a CRO (Conversion Rate Optimization) expert.

Analyze the following website as a ${persona}.

Your task:
1. Identify the top 5 conversion issues
2. Explain each issue clearly
3. Suggest actionable improvements
4. Rewrite the hero section (headline, subheadline, CTA)
5. Assign an overall conversion score from 0 to 100

Focus on:
- Clarity of value proposition
- Call-to-action effectiveness
- Trust signals
- UX readability
- Persuasiveness

Return the output in JSON format with keys: score, summary, issues, improvements, rewrite.
Also include:
- action_plan: array of exactly 3 prioritized tasks with keys {priority, task, expected_impact, effort}
- business_impact: one short paragraph explaining likely conversion impact in plain language.

Website content:
${websiteText}`;
}

function heuristicAnalysis(persona, websiteText) {
  const lower = websiteText.toLowerCase();
  const hasPrice = lower.includes("pricing") || lower.includes("$") || lower.includes("plan");
  const hasTrust =
    lower.includes("testimonial") ||
    lower.includes("review") ||
    lower.includes("trusted") ||
    lower.includes("customers");
  const hasCta =
    lower.includes("start") ||
    lower.includes("sign up") ||
    lower.includes("book") ||
    lower.includes("get started") ||
    lower.includes("try");

  let score = 55;
  if (hasPrice) score += 8;
  if (hasTrust) score += 8;
  if (hasCta) score += 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    summary:
      "This homepage has a decent base, but clearer messaging, stronger trust signals, and sharper CTA structure would likely improve conversions.",
    issues: [
      {
        title: "Value proposition may be vague",
        description:
          "The main offer is not immediately explicit for a first-time visitor skimming quickly.",
        impact: "High",
        suggestion: "Use a one-line headline that states who it is for, what it does, and the primary benefit."
      },
      {
        title: "Call-to-action hierarchy is weak",
        description: "The next step is not always visually dominant or specific.",
        impact: "High",
        suggestion: "Add one clear primary CTA above the fold with action-first wording."
      },
      {
        title: "Trust signals are limited",
        description: "Visitors may not see enough evidence to believe claims quickly.",
        impact: "Medium",
        suggestion: "Add testimonials, customer logos, ratings, or brief proof metrics near the hero."
      },
      {
        title: "Potential friction in scanning",
        description: "Dense wording can make it harder to understand value in 5–10 seconds.",
        impact: "Medium",
        suggestion: "Use short sections, bullets, and clear heading structure for faster scanning."
      },
      {
        title: "Persona alignment opportunity",
        description: `The copy may not fully reflect priorities of a ${persona}.`,
        impact: "Medium",
        suggestion: "Introduce persona-specific messaging and outcomes in the first screenful."
      }
    ],
    improvements: [
      "Strengthen the first headline with a specific promised outcome.",
      "Place one high-contrast primary CTA above the fold.",
      "Add immediate trust proof near hero content.",
      "Tighten copy and prioritize skim-friendly structure.",
      `Tailor benefits and objections for a ${persona}.`
    ],
    action_plan: [
      {
        priority: 1,
        task: "Clarify the hero headline and primary value proposition for first-time visitors.",
        expected_impact: "High",
        effort: "Low"
      },
      {
        priority: 2,
        task: "Make one primary CTA visually dominant above the fold.",
        expected_impact: "High",
        effort: "Low"
      },
      {
        priority: 3,
        task: "Add social proof (testimonials, logos, or metrics) near the hero.",
        expected_impact: "Medium",
        effort: "Medium"
      }
    ],
    business_impact:
      "These changes should reduce confusion during the first 10 seconds, increase trust, and improve the percentage of visitors who click a primary call-to-action.",
    rewrite: {
      headline: "Convert more visitors with a clearer homepage in days",
      subheadline:
        `Built for ${persona}: clarify your offer, reduce friction, and guide users to take action faster.`,
      cta: "Analyze My Homepage"
    }
  };
}

async function analyzeWithOpenAI({ apiKey, persona, websiteText }) {
  const prompt = buildPrompt({ persona, websiteText });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a strict CRO auditor that always returns valid JSON."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM returned empty response.");

  return JSON.parse(text);
}

function normalizeResult(raw) {
  return {
    score: Number.isFinite(Number(raw?.score)) ? Number(raw.score) : 60,
    summary: raw?.summary || "No summary provided.",
    issues: Array.isArray(raw?.issues) ? raw.issues.slice(0, 5) : [],
    improvements: Array.isArray(raw?.improvements) ? raw.improvements : [],
    action_plan: Array.isArray(raw?.action_plan) ? raw.action_plan.slice(0, 3) : [],
    business_impact: raw?.business_impact || "",
    rewrite: {
      headline: raw?.rewrite?.headline || "Improve conversion clarity on your homepage",
      subheadline: raw?.rewrite?.subheadline || "Reduce friction with clearer copy and stronger calls-to-action.",
      cta: raw?.rewrite?.cta || "Get Started"
    }
  };
}

async function analyzeWithLLM({ persona, websiteText, apiKey }) {
  try {
    if (apiKey) {
      const raw = await analyzeWithOpenAI({ apiKey, persona, websiteText });
      return normalizeResult(raw);
    }
  } catch (error) {
    console.warn("Falling back to heuristic analysis:", error.message);
  }

  return normalizeResult(heuristicAnalysis(persona, websiteText));
}

module.exports = { analyzeWithLLM };
