function estimateStepDropOff(step, totalSteps) {
  const baseDrop = 0.16;
  const progressivePenalty = step * 0.04;
  const depthPenalty = totalSteps > 3 ? 0.02 : 0;
  return Math.min(0.65, baseDrop + progressivePenalty + depthPenalty);
}

function scorePageContent(persona, text) {
  const lower = text.toLowerCase();
  let score = 48;

  const signals = [
    { match: /pricing|\$|plan|free trial|checkout/, delta: 10 },
    { match: /testimonial|review|trusted|customers|case study/, delta: 8 },
    { match: /start|sign up|book|get started|buy now|try/, delta: 9 },
    { match: /secure|guarantee|refund|gdpr|privacy/, delta: 7 },
    { match: /faq|questions|support|contact/, delta: 4 }
  ];

  signals.forEach(({ match, delta }) => {
    if (match.test(lower)) score += delta;
  });

  return Math.max(15, Math.min(96, score));
}

function heuristicallyInferStepType(url, text) {
  const source = `${url} ${text}`.toLowerCase();
  if (/checkout|payment|billing|subscribe/.test(source)) return "checkout";
  if (/pricing|plans/.test(source)) return "pricing";
  if (/sign up|register|trial|book demo/.test(source)) return "signup";
  if (/product|features|solutions/.test(source)) return "product";
  return "landing";
}

function buildPagePainPoints(persona, text, stepType) {
  const lower = text.toLowerCase();
  const painPoints = [];

  if (!/start|sign up|get started|buy|book/.test(lower)) {
    painPoints.push({
      title: "Weak primary CTA",
      impact: "High",
      recommendation: "Add one prominent, action-oriented CTA above the fold."
    });
  }

  if (!/testimonial|review|trusted|customers|case study|logos/.test(lower)) {
    painPoints.push({
      title: "Insufficient trust proof",
      impact: "Medium",
      recommendation: "Add social proof close to conversion points."
    });
  }

  if (stepType !== "landing" && !/privacy|secure|guarantee|refund/.test(lower)) {
    painPoints.push({
      title: "Risk-reversal signals missing",
      impact: "Medium",
      recommendation: "Reassure users with policy clarity and guarantees."
    });
  }

  painPoints.push({
    title: "Persona alignment can be tighter",
    impact: "Medium",
    recommendation: `Reflect concrete outcomes that matter to a ${persona} earlier in the page.`
  });

  return painPoints.slice(0, 5);
}

function chooseTopLinks(links, currentUrl, visited) {
  const currentHost = new URL(currentUrl).host;
  const keywords = [
    "pricing",
    "plan",
    "product",
    "feature",
    "signup",
    "sign-up",
    "register",
    "trial",
    "demo",
    "checkout",
    "buy",
    "contact"
  ];

  const ranked = links
    .filter((link) => {
      if (!link?.href || visited.has(link.href)) return false;
      try {
        return new URL(link.href).host === currentHost;
      } catch {
        return false;
      }
    })
    .map((link) => {
      const haystack = `${link.href} ${link.text || ""}`.toLowerCase();
      const keywordHits = keywords.reduce((acc, keyword) => acc + (haystack.includes(keyword) ? 1 : 0), 0);
      return { ...link, score: keywordHits };
    })
    .sort((a, b) => b.score - a.score);

  return ranked;
}

function buildHeuristicFunnel({ persona, pages, requestedDepth }) {
  let retained = 1;
  const firstPage = pages[0] || {};

  const funnelSteps = pages.map((page, index) => {
    const step = index + 1;
    const stepType = heuristicallyInferStepType(page.url, page.text);
    const pageScore = scorePageContent(persona, page.text);
    const dropOff = estimateStepDropOff(step, pages.length);
    const exitRate = Math.min(0.9, Math.max(0.05, dropOff + (70 - pageScore) / 250));
    retained = retained * (1 - exitRate);

    return {
      step,
      stepType,
      url: page.url,
      title: page.title || `Step ${step}`,
      pageScore,
      estimatedExitRate: Number(exitRate.toFixed(3)),
      retainedProbability: Number(retained.toFixed(3)),
      painPoints: buildPagePainPoints(persona, page.text, stepType)
    };
  });

  const finalConversionProbability = Number((retained * 100).toFixed(1));
  const totalEstimatedExitRate = Number((100 - finalConversionProbability).toFixed(1));
  const avgScore = funnelSteps.reduce((acc, step) => acc + step.pageScore, 0) / (funnelSteps.length || 1);

  return {
    score: Number(avgScore.toFixed(0)),
    summary:
      "FunnelScan traversed the requested funnel path and estimated where users are most likely to drop, with step-by-step friction signals and recommendations.",
    funnel: {
      requestedDepth: requestedDepth || pages.length,
      analyzedSteps: funnelSteps.length,
      steps: funnelSteps,
      finalConversionProbability,
      totalEstimatedExitRate,
      overallRecommendations: [
        "Tighten message match between each step so intent carries forward.",
        "Reduce decision friction by keeping one clear CTA per step.",
        "Add trust and risk-reversal cues before high-friction actions.",
        `Use persona-specific benefit framing for ${persona} at every transition.`
      ]
    },
    issues: funnelSteps.flatMap((step) =>
      step.painPoints.slice(0, 2).map((point) => ({
        title: `[Step ${step.step}] ${point.title}`,
        description: point.recommendation,
        impact: point.impact,
        suggestion: point.recommendation
      }))
    ).slice(0, 6),
    improvements: [
      "Instrument per-step analytics events to replace heuristic exit-rate estimates with real behavior.",
      "Run A/B tests on the highest-exit step before broad redesign.",
      "Shorten form length and number of decisions on conversion-critical pages."
    ],
    rewrite: {
      headline: `Turn ${firstPage.title || "your first page"} into a stronger first impression`,
      subheadline: `For ${persona}: clarify the value proposition on ${firstPage.url || "the landing page"} and guide users to the next step.`,
      cta: "Start on This Page"
    }
  };
}

async function analyzeWithLLM({ persona, pages, requestedDepth }) {
  return buildHeuristicFunnel({ persona, pages, requestedDepth });
}

module.exports = { analyzeWithLLM, chooseTopLinks };
