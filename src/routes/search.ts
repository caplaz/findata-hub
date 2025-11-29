/**
 * Search Routes module
 * Search functionality endpoints
 * @module routes/search
 */

import { Router, Request, Response } from "express";

import { cache, CACHE_ENABLED } from "../config/cache";
import type { SearchResult, ErrorResponse } from "../types";
import { log } from "../utils/logger";
import yahooFinance from "../yahoo";

const router = Router();

// ============================================================================
// Route Types
// ============================================================================

interface SearchRequestBody {
  query: string;
}

type SearchResponseBody = SearchResult;

// ============================================================================
// Search Endpoint
// ============================================================================

/**
 * @swagger
 * /search:
 *   post:
 *     summary: Search for symbols and news
 *     description: Search for stock symbols, news articles, and financial data
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search term (company name, symbol, etc.)
 *                 example: "apple"
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResult'
 *             example:
 *               quotes: [{"symbol": "AAPL", "shortname": "Apple Inc."}]
 *               news: [{"title": "Apple Inc. news", "publisher": "Yahoo Finance"}]
 *               count: 1
 *       400:
 *         description: Bad request - missing or invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  async (
    req: Request<{}, SearchResponseBody | ErrorResponse, SearchRequestBody>,
    res: Response<SearchResponseBody | ErrorResponse>
  ) => {
    const { query } = req.body;

    // Validate request body
    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        error: "Query parameter is required and must be a non-empty string",
      });
    }

    const trimmedQuery = query.trim();
    const cacheKey = `search:${trimmedQuery}`;

    log("info", `Search request for "${trimmedQuery}" from ${req.ip}`);

    if (CACHE_ENABLED) {
      const cached = await cache.get<SearchResponseBody>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for search: ${trimmedQuery}`);
        return res.json(cached);
      }
      log("debug", `Cache miss for search: ${trimmedQuery}`);
    }

    try {
      const result = await yahooFinance.search(trimmedQuery);
      log(
        "debug",
        `Search completed for "${trimmedQuery}": ${
          result.quotes?.length || 0
        } quotes, ${result.news?.length || 0} news`
      );

      if (CACHE_ENABLED) {
        await cache.set<SearchResponseBody>(cacheKey, result);
        log("debug", `Cached search results for ${trimmedQuery}`);
      }

      res.json(result);
    } catch (err) {
      log(
        "error",
        `Search endpoint error for "${trimmedQuery}": ${(err as Error).message}`,
        err
      );
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

export default router;
