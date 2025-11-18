/**
 * Trending Routes module
 * Trending symbols endpoints
 * @module routes/trending
 */

import { Router } from "express";
import yahooFinance from "../yahoo.js";
import { cache, CACHE_ENABLED } from "../config/cache.js";
import { log } from "../utils/logger.js";

const router = Router();

// ============================================================================
// Trending Endpoint
// ============================================================================

/**
 * @swagger
 * /trending/{region}:
 *   get:
 *     summary: Get trending symbols
 *     description: Retrieve currently trending stock symbols for a specific region
 *     tags: [Trending]
 *     parameters:
 *       - in: path
 *         name: region
 *         required: true
 *         description: Region code (US, CA, UK, DE, FR, etc.)
 *         schema:
 *           type: string
 *         example: "US"
 *     responses:
 *       200:
 *         description: Trending symbols data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrendingResult'
 *             example:
 *               count: 5
 *               quotes: [{"symbol": "AAPL"}, {"symbol": "TSLA"}]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:region", async (req, res) => {
  const region = req.params.region || "US";
  const cacheKey = `trending:${region}`;

  log("info", `Trending symbols request for region: ${region} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for trending: ${region}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for trending: ${region}`);
  }

  try {
    const result = await yahooFinance.trendingSymbols(region);
    log(
      "debug",
      `Trending symbols for ${region}: ${result.quotes?.length || 0} symbols`
    );

    if (CACHE_ENABLED) {
      cache.set(cacheKey, result);
      log("debug", `Cached trending symbols for ${region}`);
    }

    res.json(result);
  } catch (err) {
    log(
      "error",
      `Trending symbols endpoint error for "${region}": ${err.message}`,
      err
    );
    res.status(500).json({ error: err.message });
  }
});

export default router;
