/**
 * Info Routes module
 * Company information endpoints
 * @module routes/info
 */

import { Router } from "express";
import yahooFinance from "../yahoo.js";
import { cache, CACHE_ENABLED } from "../config/cache.js";
import { log } from "../utils/logger.js";

const router = Router();

// ============================================================================
// Company Info Endpoint
// ============================================================================

/**
 * @swagger
 * /info/{symbols}:
 *   get:
 *     summary: Get company information
 *     description: Retrieve detailed company information and profiles for one or more symbols
 *     tags: [Company Info]
 *     parameters:
 *       - in: path
 *         name: symbols
 *         required: true
 *         description: Comma-separated list of stock symbols
 *         schema:
 *           type: string
 *         example: "AAPL,MSFT"
 *     responses:
 *       200:
 *         description: Company information data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/CompanyInfo'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:symbols", async (req, res) => {
  const symbols = req.params.symbols;
  const cacheKey = `info:${symbols}`;
  const symbolList = symbols.split(",").map((s) => s.trim());

  log(
    "info",
    `Info request for symbols: ${symbolList.join(", ")} from ${req.ip}`
  );

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for info: ${symbols}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for info: ${symbols}`);
  }

  try {
    log("debug", `Fetching company info for ${symbolList.length} symbols`);
    const promises = symbolList.map((symbol) =>
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile"],
      })
    );
    const results = await Promise.allSettled(promises);

    const data = {};
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      const symbol = symbolList[index];
      if (result.status === "fulfilled") {
        data[symbol] = result.value;
        successCount++;
        log("debug", `Successfully fetched info for ${symbol}`);
      } else {
        data[symbol] = { error: result.reason.message };
        errorCount++;
        log(
          "warn",
          `Failed to fetch info for ${symbol}: ${result.reason.message}`
        );
      }
    });

    log(
      "info",
      `Info request completed: ${successCount} successful, ${errorCount} failed`
    );

    if (CACHE_ENABLED) {
      cache.set(cacheKey, data);
      log("debug", `Cached info data for ${symbols}`);
    }

    res.json(data);
  } catch (err) {
    log("error", `Info endpoint error: ${err.message}`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
