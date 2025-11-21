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
 *     description: Retrieve ETF holdings, sector allocations, and position breakdowns. Falls back to basic ETF information if detailed holdings are unavailable.
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
 *         description: ETF holdings data or fallback basic information
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ETFHoldings'
 *                 - $ref: '#/components/schemas/ETFFallback'
 *             examples:
 *               detailed:
 *                 summary: Detailed holdings data
 *                 value:
 *                   holdings: [{"symbol": "AAPL", "holdingPercent": 6.61}]
 *                   sectorWeightings: [{"sector": "Technology", "percentage": 25.5}]
 *                   equityHoldings: {"priceToEarnings": 22.5}
 *               fallback:
 *                 summary: Fallback basic information
 *                 value:
 *                   fallback: true
 *                   symbol: "SPY"
 *                   shortName: "SPDR S&P 500 ETF Trust"
 *                   regularMarketPrice: 450.25
 *                   marketCap: 450000000000
 *                   message: "Detailed holdings data not available. Showing basic ETF information."
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
    // Try to get detailed holdings data first
    let result;
    try {
      result = await yahooFinance.quoteSummary(symbol, {
        modules: ["topHoldings", "sectorWeightings", "equityHoldings"],
      });
    } catch (holdingsError) {
      log(
        "warn",
        `Detailed holdings not available for ${symbol}, using fallback: ${holdingsError.message}`
      );

      // Fallback: Get basic quote data
      const quoteData = await yahooFinance.quote(symbol);

      result = {
        fallback: true,
        symbol: quoteData.symbol,
        shortName: quoteData.shortName,
        longName: quoteData.longName,
        regularMarketPrice: quoteData.regularMarketPrice,
        marketCap: quoteData.marketCap,
        volume: quoteData.volume,
        averageVolume: quoteData.averageVolume,
        fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
        message:
          "Detailed holdings data not available. Showing basic ETF information.",
      };
    }

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
