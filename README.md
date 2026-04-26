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
- Rewritten hero section (conversion-optimized)
- Simple scoring system (0–100)
- Optional agent execution logs

---

## Tech Stack

### Backend
- Node.js (Express) OR Python (FastAPI)
- LLM API (OpenAI / Claude via TokenRouter)
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

## Agent Framing (Important)

The system should behave like an autonomous agent:

* Display execution logs
* Use language like:

  * "Analyzing..."
  * "Simulating user..."
  * "Generating report..."

---

## Optional: AgentHansa Integration

(Not required but bonus)

### Agent Definition

* Name: FunnelScan Agent
* Description: AI agent that performs CRO audits on websites

### API Endpoint

Expose:

```
POST /analyze
```

### Example Service

* Name: Website CRO Audit
* Price: $50
* Deliverable: Conversion audit report

---

## Environment Variables

```
LLM_API_KEY=your_key_here
PORT=3000
```

---

## Constraints

* Must be buildable in 3–4 hours
* Avoid complex crawling
* Homepage analysis only
* Focus on output quality over architecture

---

## Success Criteria

The project is successful if:

* The agent works end-to-end
* The output is clear and useful
* The demo is visually understandable in <10 seconds
* The value proposition is obvious

---

## Demo Script (Reference)

1. Input a real website
2. Click analyze
3. Show agent logs
4. Display:

   * Score
   * Issues
   * Improvements
   * Rewritten hero
5. Explain:
   "This agent helps businesses identify and fix conversion problems automatically."

---

## Future Extensions (Not for hackathon)

* Multi-page crawling
* Real user simulation
* A/B testing suggestions
* Integration with analytics tools
* Continuous monitoring

---

## License

MIT 
