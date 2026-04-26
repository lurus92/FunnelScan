# How to Run FunnelScan Agent

Follow these steps exactly from the project root.

## 1) Prerequisites

1. Install **Node.js 18+** and npm.
2. Open a terminal in this folder (`/workspace/FunnelScan`).

## 2) Install dependencies

```bash
npm install
```

## 3) Configure environment variables

Create a `.env` file:

```bash
cat > .env <<'ENV'
PORT=3000
# Optional (recommended): enables real LLM analysis.
# If omitted, FunnelScan uses a built-in heuristic analyzer.
# LLM_API_KEY=your_openai_api_key
ENV
```

Notes:
- `PORT` controls where the server runs.
- `LLM_API_KEY` (or `OPENAI_API_KEY`) is optional.

## 4) Start the agent server

```bash
npm start
```

Expected output:

```text
FunnelScan agent running on http://localhost:3000
```

## 5) Open the UI

Open this URL in your browser:

```text
http://localhost:3000
```

## 6) Run an analysis from the UI

1. Enter a website URL (for example: `https://example.com`).
2. Enter a persona (for example: `E-commerce shopper`).
3. Click **Analyze Website**.
4. Wait for the agent flow (`Agent started...`, `Fetching website...`, `Analyzing...`).
5. Review the output: score, issues, improvements, hero rewrite, and logs.

## 7) (Optional) Run via API directly

In a new terminal while server is running:

```bash
curl -X POST http://localhost:3000/analyze \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","persona":"E-commerce shopper"}'
```

## 8) Stop the agent

Press `Ctrl + C` in the server terminal.
