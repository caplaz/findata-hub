/**
 * Yahoo Finance API Server
 * Express.js server providing Yahoo Finance data via yahoo-finance2 library.
 * Features: multi-ticker support, caching, rate limiting, health checks, error handling.
 * @module server
 */

import express from "express";
import rateLimit from "express-rate-limit";
import yahooFinance from "./yahoo.js";
import NodeCache from "node-cache";

const app = express();
app.use(express.json());

// Caching: configurable via env vars
const CACHE_ENABLED = process.env.CACHE_ENABLED !== "false"; // default true
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Rate limiting: configurable via env vars (defaults: 100 requests per 15 minutes per IP)
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Health check
/**
 * GET /health
 * Health check endpoint to verify server status.
 * @returns {Object} JSON response with status "ok"
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Quote endpoint - supports multiple symbols (comma-separated)
/**
 * GET /quote/:symbols
 * Retrieves current stock quote data for one or more symbols.
 * Supports caching and rate limiting.
 * @param {string} req.params.symbols - Comma-separated list of stock symbols (e.g., "AAPL,GOOGL")
 * @returns {Array<Object|null>} Array of quote objects or null for invalid symbols
 * @example
 * GET /quote/AAPL -> [{"price": {"regularMarketPrice": 150.25, ...}}]
 * GET /quote/AAPL,INVALID -> [{"price": {...}}, null]
 */
app.get("/quote/:symbols", async (req, res) => {
  const symbols = req.params.symbols;
  const cacheKey = `quote:${symbols}`;

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  try {
    const symbolList = symbols.split(",");
    const promises = symbolList.map((symbol) =>
      yahooFinance.quoteSummary(symbol.trim())
    );
    const results = await Promise.allSettled(promises);

    const data = {};
    results.forEach((result, index) => {
      const symbol = symbolList[index].trim();
      if (result.status === "fulfilled") {
        data[symbol] = result.value;
      } else {
        data[symbol] = { error: result.reason.message };
      }
    });

    if (CACHE_ENABLED) {
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// History endpoint - supports multiple symbols (comma-separated)
/**
 * GET /history/:symbols
 * Retrieves historical price data for one or more symbols.
 * Supports caching and rate limiting.
 * @param {string} req.params.symbols - Comma-separated list of stock symbols
 * @param {string} [req.query.period="1y"] - Time period (e.g., "1y", "6mo")
 * @param {string} [req.query.interval="1d"] - Data interval (e.g., "1d", "1wk")
 * @returns {Array<Array<Object>|null>} Array of historical data arrays or null for failures
 * @example
 * GET /history/AAPL?period=1y&interval=1d -> [[{"date": "2023-01-01", "close": 150, ...}]]
 */
app.get("/history/:symbols", async (req, res) => {
  const symbols = req.params.symbols;
  const { period = "1y", interval = "1d" } = req.query;
  const cacheKey = `history:${symbols}:${period}:${interval}`;

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  try {
    // Convert period to period1/period2 for chart API
    const now = new Date();
    let period1;
    switch (period) {
      case "1d":
        period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "5d":
        period1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      case "1mo":
        period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3mo":
        period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6mo":
        period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "2y":
        period1 = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        break;
      case "5y":
        period1 = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      case "10y":
        period1 = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
        break;
      case "ytd":
        period1 = new Date(now.getFullYear(), 0, 1);
        break;
      case "max":
        period1 = new Date(1970, 0, 1);
        break;
      default:
        period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // default to 1y
    }

    const promises = symbols.split(",").map((symbol) =>
      yahooFinance.chart(symbol, {
        period1: Math.floor(period1.getTime() / 1000),
        period2: Math.floor(now.getTime() / 1000),
        interval,
      })
    );
    const results = await Promise.allSettled(promises);
    const data = results.map((result) =>
      result.status === "fulfilled" ? result.value.quotes : null
    );
    if (CACHE_ENABLED) {
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Info endpoint - supports multiple symbols (comma-separated)
// Info endpoint - supports multiple symbols (comma-separated)
/**
 * GET /info/:symbols
 * Retrieves company information for one or more symbols.
 * Supports caching and rate limiting.
 * @param {string} req.params.symbols - Comma-separated list of stock symbols
 * @returns {Array<Object|null>} Array of info objects or null for failures
 * @example
 * GET /info/AAPL -> [{"assetProfile": {"name": "Apple Inc.", ...}, "summaryProfile": {...}}]
 */
app.get("/info/:symbols", async (req, res) => {
  const symbols = req.params.symbols;
  const cacheKey = `info:${symbols}`;

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  try {
    const promises = symbols.split(",").map((symbol) =>
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "summaryProfile"],
      })
    );
    const results = await Promise.allSettled(promises);
    const data = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );
    if (CACHE_ENABLED) {
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 3000;
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
