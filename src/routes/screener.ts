/**
 * Screener Routes module
 * Stock screener endpoints
 * @module routes/screener
 */

import { Router, Request, Response } from "express";
import yahooFinance from "../yahoo";
import { cache, CACHE_ENABLED } from "../config/cache";
import { log } from "../utils/logger";

const router = Router();

// ============================================================================
// Screener Endpoint
// ============================================================================

/**
 * @swagger
 * /screener/{type}:
 *   get:
 *     summary: Get stock screener results
 *     description: Retrieve stock screening results for different categories like gainers, losers, and most active
 *     tags: [Screener]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         description: Screener type
 *         schema:
 *           type: string
 *           enum: [day_gainers, day_losers, most_actives, most_shorted]
 *         example: "day_gainers"
 *       - in: query
 *         name: count
 *         description: Number of results to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *         example: 25
 *     responses:
 *       200:
 *         description: Stock screener results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScreenerResult'
 *             example:
 *               quotes: [{"symbol": "AAPL", "regularMarketChangePercent": 5.2}]
 *               total: 100
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:type", async (req: Request, res: Response) => {
  const type = req.params.type;
  const count = parseInt(req.query.count as string) || 25;
  const cacheKey = `screener:${type}:${count}`;

  log(
    "info",
    `Screener request for type: ${type}, count: ${count} from ${req.ip}`
  );

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for screener: ${type}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for screener: ${type}`);
  }

  try {
    let scrIds;
    switch (type) {
      case "day_gainers":
        scrIds = "day_gainers";
        break;
      case "day_losers":
        scrIds = "day_losers";
        break;
      case "most_actives":
        scrIds = "most_actives";
        break;
      case "most_shorted":
        scrIds = "most_shorted_stocks";
        break;
      default:
        scrIds = type; // Allow custom screener IDs
    }

    const result = await yahooFinance.screener({
      scrIds: [type],
      count,
    } as any);
    log(
      "debug",
      `Screener results for ${type}: ${result.quotes?.length || 0} symbols`
    );

    if (CACHE_ENABLED) {
      cache.set(cacheKey, result);
      log("debug", `Cached screener results for ${type}`);
    }

    res.json(result);
  } catch (err) {
    log(
      "error",
      `Screener endpoint error for "${type}": ${(err as Error).message}`,
      err
    );
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
