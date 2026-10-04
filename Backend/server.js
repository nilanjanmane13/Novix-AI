const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const interviewRouter = require("./routes/interview");
const sessionStore = require("./services/sessionStore");
const { getProviderInfo } = require("./services/aiClient");

const app = express();

// CORS_ORIGIN can be a comma-separated list (e.g. your Vercel URL).
// Not needed when the backend serves the built frontend itself.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ai: getProviderInfo(), uptimeSeconds: Math.round(process.uptime()) });
});

// Single interview endpoint family (see Data/technical-spec.md).
app.use("/api/interview", interviewRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Serve the production frontend build when it exists (single-service deploys).
const distDir = path.join(__dirname, "..", "Frontend", "dist");
if (fs.existsSync(path.join(distDir, "index.html"))) {
  app.use(express.static(distDir, { maxAge: "1h", index: false }));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "Novix AI Interview Agent backend is running. Build the frontend (npm run build) to serve the UI from here.",
      ai: getProviderInfo(),
    });
  });
}

// JSON error handler (bad JSON bodies, unexpected throws).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error("[server] Unhandled error:", err);
  res.status(status).json({ error: status === 400 ? "Invalid request body." : "Unexpected server error." });
});

setInterval(() => sessionStore.sweepStaleSessions(), 1000 * 60 * 30).unref();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const info = getProviderInfo();
  console.log(`Novix AI server running on port ${PORT}`);
  if (info.configured) {
    console.log(`AI provider: ${info.provider} · model: ${info.model}`);
  } else {
    console.warn(`AI provider NOT configured: ${info.problem || "missing API key"}`);
    console.warn("Copy Backend/.env.example to Backend/.env and set NVIDIA_API_KEY.");
  }
});
