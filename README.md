# FunnelScan — AI CRO Audit Agent

## Overview

FunnelScan is an AI-powered agent that analyzes a website and produces a Conversion Rate Optimization (CRO) audit.

The agent simulates a target user persona, identifies friction points, and generates actionable improvements to increase conversions.

This project is designed as a lightweight, demo-ready AI agent for the **AI Agent Economy Hackathon**.

---

## Core Concept

FunnelScan is NOT a full SaaS platform.

It is an **AI agent exposed via API** that:

1. Accepts a website URL and a user persona
2. Traverses multiple funnel pages from that URL
3. Scores each step and estimates exit rates
4. Returns a structured CRO + funnel JSON report

---

## Key Features

- Multi-page funnel traversal (depth controlled)
- Persona-based UX analysis
- Identification of conversion issues
- Suggested improvements
- Rewritten hero section for the entry page (conversion-optimized)
- Simple scoring system (0–100)
- Agent execution logs

---

## Tech Stack

### Backend
- Node.js (Express) OR Python (FastAPI)
- LLM API (Euristic for now, implementation of OpenAI 4.1 mini pending)
- Native fetch (no heavy scraping libraries required)

### Frontend (minimal)
- Simple HTML + JavaScript OR Next.js
- Single page UI

---

## Project Structure

```

funnel-scan/
│
├── backend/
│   ├── server.js (or main.py)
│   ├── routes/
│   │   └── analyze.js
│   ├── services/
│   │   ├── fetchWebsite.js
│   │   └── analyzeWithLLM.js
│   └── utils/
│       └── cleanHtml.js
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── README.md
└── .env

```

---

## API Specification

### Endpoint

```

POST /analyze

````

### Request Body

```json
{
  "url": "https://example.com",
  "persona": "E-commerce shopper",
  "depth": 4
}
````

### Response Format

```json
{
  "score": 62,
  "summary": "The website has solid foundations but suffers from unclear messaging and weak CTAs.",
  "issues": [
    {
      "title": "Unclear Value Proposition",
      "description": "The homepage does not clearly communicate the core offering.",
      "impact": "High",
      "suggestion": "Rewrite the headline to clearly state the value in one sentence."
    }
  ],
  "improvements": [
    "Add strong CTA above the fold",
    "Include social proof elements"
  ],
  "rewrite": {
    "headline": "Grow your business faster with AI-powered tools",
    "subheadline": "Simple pricing. Trusted by thousands.",
    "cta": "Start Free Trial"
  },

  "funnel": {
    "requestedDepth": 4,
    "analyzedSteps": 4,
    "finalConversionProbability": 32.4,
    "totalEstimatedExitRate": 67.6,
    "steps": [
      {
        "step": 1,
        "stepType": "landing",
        "url": "https://example.com",
        "pageScore": 68,
        "estimatedExitRate": 0.24,
        "retainedProbability": 0.76,
        "painPoints": [
          {
            "title": "Weak primary CTA",
            "impact": "High",
            "recommendation": "Add one prominent CTA above the fold."
          }
        ]
      }
    ],
    "overallRecommendations": [
      "Tighten message match between each step"
    ]
  },
  "logs": [
    "Fetching website content...",
    "Simulating persona: E-commerce shopper...",
    "Analyzing UX and conversion flow...",
    "Generating improvements..."
  ]
}
```

---

## Core Logic

### Step 1: Fetch Website Content

* Use `fetch(url)`
* Extract visible text from `<body>`
* Remove scripts, styles, and irrelevant tags
* Limit content to ~3000–5000 characters

---

### Step 2: LLM Prompt

Use the following prompt template:

```
You are a CRO (Conversion Rate Optimization) expert.

Analyze the following website as a [PERSONA].

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

Return the output in JSON format.

Website content:
[PASTE WEBSITE TEXT HERE]
```

---

### Step 3: Parse Output

* Ensure JSON is valid
* Fallback: extract manually if malformed
* Normalize fields

---

## Frontend Requirements (Minimal)

Single-page UI with:

### Inputs:

* Website URL
* Persona (dropdown or text input)

### Button:

* "Analyze Website"

### Output:

* Score (large number)
* List of issues
* Suggested improvements
* Rewritten hero section
* Agent logs (optional but recommended)

---

## UX Behavior

When user clicks "Analyze":

1. Show loading state:

   * "Agent started..."
   * "Fetching website..."
   * "Analyzing..."

2. Display results cleanly

---

## Example Execution

Input
* URL: [https://verizon ](https://www.verizon.com/)
* Persona: "Person willing to buy an iPhone 16"
* Page depth: 4

Result JSON:
```
{
  "score": 72,
  "summary": "FunnelScan traversed the requested funnel path and estimated where users are most likely to drop, with step-by-step friction signals and recommendations.",
  "funnel": {
    "requestedDepth": 3,
    "analyzedSteps": 2,
    "steps": [
      {
        "step": 1,
        "stepType": "checkout",
        "url": "https://www.verizon.com/",
        "title": "Verizon: Wireless, Internet, TV and Phone Services | Official Site",
        "pageScore": 86,
        "estimatedExitRate": 0.136,
        "retainedProbability": 0.864,
        "painPoints": [
          {
            "title": "Persona alignment can be tighter",
            "impact": "Medium",
            "recommendation": "Reflect concrete outcomes that matter to a Person willing to buy an iPhone 17 earlier in the page."
          }
        ]
      },
      {
        "step": 2,
        "stepType": "product",
        "url": "https://www.verizon.com/products-perks/perks/",
        "title": "Plan perks for myPlan and myHome | Verizon",
        "pageScore": 58,
        "estimatedExitRate": 0.288,
        "retainedProbability": 0.615,
        "painPoints": [
          {
            "title": "Weak primary CTA",
            "impact": "High",
            "recommendation": "Add one prominent, action-oriented CTA above the fold."
          },
          {
            "title": "Insufficient trust proof",
            "impact": "Medium",
            "recommendation": "Add social proof close to conversion points."
          },
          {
            "title": "Risk-reversal signals missing",
            "impact": "Medium",
            "recommendation": "Reassure users with policy clarity and guarantees."
          },
          {
            "title": "Persona alignment can be tighter",
            "impact": "Medium",
            "recommendation": "Reflect concrete outcomes that matter to a Person willing to buy an iPhone 17 earlier in the page."
          }
        ]
      }
    ],
    "finalConversionProbability": 61.5,
    "totalEstimatedExitRate": 38.5,
    "overallRecommendations": [
      "Tighten message match between each step so intent carries forward.",
      "Reduce decision friction by keeping one clear CTA per step.",
      "Add trust and risk-reversal cues before high-friction actions.",
      "Use persona-specific benefit framing for Person willing to buy an iPhone 17 at every transition."
    ]
  },
  "issues": [
    {
      "title": "[Step 1] Persona alignment can be tighter",
      "description": "Reflect concrete outcomes that matter to a Person willing to buy an iPhone 17 earlier in the page.",
      "impact": "Medium",
      "suggestion": "Reflect concrete outcomes that matter to a Person willing to buy an iPhone 17 earlier in the page."
    },
    {
      "title": "[Step 2] Weak primary CTA",
      "description": "Add one prominent, action-oriented CTA above the fold.",
      "impact": "High",
      "suggestion": "Add one prominent, action-oriented CTA above the fold."
    },
    {
      "title": "[Step 2] Insufficient trust proof",
      "description": "Add social proof close to conversion points.",
      "impact": "Medium",
      "suggestion": "Add social proof close to conversion points."
    }
  ],
  "improvements": [
    "Instrument per-step analytics events to replace heuristic exit-rate estimates with real behavior.",
    "Run A/B tests on the highest-exit step before broad redesign.",
    "Shorten form length and number of decisions on conversion-critical pages."
  ],
  "rewrite": {
    "headline": "Turn Verizon: Wireless, Internet, TV and Phone Services | Official Site into a stronger first impression",
    "subheadline": "For Person willing to buy an iPhone 17: clarify the value proposition on https://www.verizon.com/ and guide users to the next step.",
    "cta": "Start on This Page"
  },
  "input": {
    "url": "https://www.verizon.com/",
    "persona": "Person willing to buy an iPhone 17",
    "depth": 3
  },
  "logs": [
    "Agent started...",
    "Simulating user persona: Person willing to buy an iPhone 17...",
    "Requested funnel depth: 3 page(s).",
    "Step 1: analyzing page https://www.verizon.com/",
    "Step 1: fetching HTML for https://www.verizon.com/",
    "Step 1: extracted content and discovered 164 candidate link(s).",
    "Step 1: next best step selected -> https://www.verizon.com/products-perks/perks/",
    "Step 2: analyzing page https://www.verizon.com/products-perks/perks/",
    "Step 2: fetching HTML for https://www.verizon.com/products-perks/perks/",
    "Step 2: extracted content and discovered 0 candidate link(s).",
    "Step 2: no high-intent internal link found. Traversal complete.",
    "Aggregating funnel pain points and conversion estimates...",
    "Generating final funnel report..."
  ]
}
```

---

## License

MIT 
