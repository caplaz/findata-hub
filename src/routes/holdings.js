/**
 * Holdings Routes module
 * ETF holdings and composition endpoints
 * @module routes/holdings
 */

import { Router } from "express";
import yahooFinance from "../yahoo.js";
import { cache, CACHE_ENABLED } from "../config/cache.js";
import { log } from "../utils/logger.js";

const router = Router();

// ============================================================================
// ETF Holdings Endpoint
// ============================================================================

/**
 * @swagger
 * /holdings/{symbol}:
 *   get:
 *     summary: Get ETF holdings
 *     description: Retrieve ETF holdings, sector allocations, and position breakdowns
 *     tags: [Holdings]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         description: ETF symbol
 *         schema:
 *           type: string
 *           example: "SPY"
 *     responses:
 *       200:
 *         description: ETF holdings data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ETFHoldings'
 *             example:
 *               holdings: [{"symbol": "AAPL", "holdingPercent": 6.61}]
 *               sectorWeightings: [{"sector": "Technology", "percentage": 25.5}]
 *               equityHoldings: {"priceToEarnings": 22.5}
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `holdings:${symbol}`;

  log("info", `ETF holdings request for ${symbol} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for holdings: ${symbol}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for holdings: ${symbol}`);
  }

  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["topHoldings", "sectorWeightings", "equityHoldings"],
    });

    log("debug", `ETF holdings retrieved for ${symbol}`);

    if (CACHE_ENABLED) {
      cache.set(cacheKey, result);
      log("debug", `Cached holdings for ${symbol}`);
    }

    res.json(result);
  } catch (err) {
    log(
      "error",
      `Holdings endpoint error for "${symbol}": ${err.message}`,
      err
    );
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Mutual Fund Holdings Endpoint
// ============================================================================

/**
 * @swagger
 * /holdings/{symbol}/fund:
 *   get:
 *     summary: Get mutual fund holdings
 *     description: Retrieve mutual fund holdings and composition data
 *     tags: [Holdings]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         description: Mutual fund symbol
 *         schema:
 *           type: string
 *           example: "VFIAX"
 *     responses:
 *       200:
 *         description: Mutual fund holdings data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundHoldings'
 *             example:
 *               fundHoldings: {"holdings": []}
 *               fundProfile: {"categoryName": "Large Blend"}
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:symbol/fund", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `fund_holdings:${symbol}`;

  log("info", `Mutual fund holdings request for ${symbol} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for fund holdings: ${symbol}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for fund holdings: ${symbol}`);
  }

  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["fundHoldings", "fundProfile"],
    });

    log("debug", `Mutual fund holdings retrieved for ${symbol}`);

    if (CACHE_ENABLED) {
      cache.set(cacheKey, result);
      log("debug", `Cached fund holdings for ${symbol}`);
    }

    res.json(result);
  } catch (err) {
    log(
      "error",
      `Fund holdings endpoint error for "${symbol}": ${err.message}`,
      err
    );
    res.status(500).json({ error: err.message });
  }
});

export default router;
