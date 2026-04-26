const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const analyzeRoute = require("./routes/analyze");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(analyzeRoute);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`FunnelScan agent running on http://localhost:${port}`);
});
