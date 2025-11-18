/**
 * Insights Routes module
 * Stock insights endpoints
 * @module routes/insights
 */

import { Router } from "express";
import yahooFinance from "../yahoo.js";
import { cache, CACHE_ENABLED } from "../config/cache.js";
import { log } from "../utils/logger.js";

const router = Router();

// ============================================================================
// Insights Endpoint
// ============================================================================

/**
 * @swagger
 * /insights/{symbol}:
 *   get:
 *     summary: Get comprehensive stock insights
 *     description: Retrieve detailed insights and analysis for a stock symbol including company snapshot, recommendations, and events
 *     tags: [Insights]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         description: Stock symbol to get insights for
 *         schema:
 *           type: string
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: Comprehensive stock insights
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsightsResult'
 *             example:
 *               symbol: "AAPL"
 *               companySnapshot: {"sectorInfo": "Technology"}
 *               recommendation: {"targetPrice": 250.0, "rating": "BUY"}
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `insights:${symbol}`;

  log("info", `Insights request for symbol: ${symbol} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for insights: ${symbol}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for insights: ${symbol}`);
  }

  try {
    const result = await yahooFinance.insights(symbol);
    log("debug", `Insights retrieved for ${symbol}`);

    if (CACHE_ENABLED) {
      cache.set(cacheKey, result);
      log("debug", `Cached insights for ${symbol}`);
    }

    res.json(result);
  } catch (err) {
    log(
      "error",
      `Insights endpoint error for "${symbol}": ${err.message}`,
      err
    );
    res.status(500).json({ error: err.message });
  }
});

export default router;
