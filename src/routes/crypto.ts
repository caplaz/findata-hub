/**
 * Crypto Routes module
 * Cryptocurrency data endpoints powered by CoinStats API
 * @module routes/crypto
 */

import { Router, Request, Response } from "express";

// Type declaration for Node.js 18+ global fetch
declare const fetch: typeof globalThis.fetch;

import { cache, CACHE_ENABLED, CACHE_TTL_SHORT } from "../config/cache";
import type {
  CoinStatsResponse,
  CoinStatsCoin,
  CoinStatsMarketData,
  ErrorResponse,
} from "../types";
import { log } from "../utils/logger";

const router = Router();

// ============================================================================
// Constants
// ============================================================================

const COINSTATS_API_BASE = "https://openapiv1.coinstats.app";
const COINSTATS_API_KEY = process.env.COINSTATS_API_KEY || "demo-api-key";

// ============================================================================
// Route Types
// ============================================================================

interface CoinsQueryParams {
  page?: string;
  limit?: string;
  coinIds?: string;
  currency?: string;
  name?: string;
  symbol?: string;
  blockchains?: string;
  includeRiskScore?: string;
  categories?: string;
  sortBy?: string;
  sortDir?: string;
}

type SortByOptions =
  | "rank"
  | "marketCap"
  | "price"
  | "volume"
  | "priceChange1h"
  | "priceChange1d"
  | "priceChange7d"
  | "name"
  | "symbol";

type SortDirOptions = "asc" | "desc";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make a request to the CoinStats API
 */
async function fetchFromCoinStats<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${COINSTATS_API_BASE}${endpoint}`);

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.append(key, value);
    }
  });

  log("debug", `Fetching from CoinStats: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-API-KEY": COINSTATS_API_KEY,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `CoinStats API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Handle standardized error responses for crypto endpoints
 */
function handleCryptoError(
  res: Response<ErrorResponse>,
  endpointName: string,
  err: unknown,
  additionalErrorChecks: string[] = []
): void {
  const errorMessage = err instanceof Error ? err.message : String(err);
  log("error", `Crypto ${endpointName} endpoint error: ${errorMessage}`, err);

  // Check for specific error patterns that might indicate different status codes
  const clientErrorPatterns = [
    "Invalid",
    "not found",
    "400",
    "401",
    "403",
    ...additionalErrorChecks,
  ];

  const isClientError = clientErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );

  if (isClientError) {
    res.status(400).json({ error: errorMessage });
  } else {
    res.status(500).json({ error: errorMessage });
  }
}

// ============================================================================
// Coins Endpoint
// ============================================================================

/**
 * @swagger
 * /crypto/coins:
 *   get:
 *     summary: Get cryptocurrency coins
 *     description: Retrieve comprehensive data about cryptocurrencies from CoinStats
 *     tags: [Crypto]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Page number to retrieve (1-based indexing)
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         description: Number of items to return per page
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         example: 20
 *       - in: query
 *         name: coinIds
 *         description: Filter coins by specific coin IDs (comma-separated)
 *         schema:
 *           type: string
 *         example: "bitcoin,ethereum,solana"
 *       - in: query
 *         name: currency
 *         description: The currency to display coin prices in
 *         schema:
 *           type: string
 *           default: "USD"
 *         example: "USD"
 *       - in: query
 *         name: name
 *         description: Search for coins by their name (supports partial matching)
 *         schema:
 *           type: string
 *         example: "bitcoin"
 *       - in: query
 *         name: symbol
 *         description: Filter coins by their ticker symbol
 *         schema:
 *           type: string
 *         example: "BTC"
 *       - in: query
 *         name: blockchains
 *         description: Filter coins by blockchain networks (comma-separated)
 *         schema:
 *           type: string
 *         example: "ethereum,solana,binance-smart-chain"
 *       - in: query
 *         name: includeRiskScore
 *         description: Include risk score data in the response
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         example: "true"
 *       - in: query
 *         name: categories
 *         description: Filter coins by categories (comma-separated)
 *         schema:
 *           type: string
 *         example: "defi,memecoins,gaming"
 *       - in: query
 *         name: sortBy
 *         description: Field to sort results by
 *         schema:
 *           type: string
 *           enum: [rank, marketCap, price, volume, priceChange1h, priceChange1d, priceChange7d, name, symbol]
 *           default: "marketCap"
 *         example: "marketCap"
 *       - in: query
 *         name: sortDir
 *         description: Sort direction for the results
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Cryptocurrency coins data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     itemCount:
 *                       type: integer
 *                     pageCount:
 *                       type: integer
 *                     hasPreviousPage:
 *                       type: boolean
 *                     hasNextPage:
 *                       type: boolean
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CoinStatsCoin'
 *             example:
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 itemCount: 150
 *                 pageCount: 8
 *                 hasPreviousPage: false
 *                 hasNextPage: true
 *               result:
 *                 - id: "bitcoin"
 *                   name: "Bitcoin"
 *                   symbol: "BTC"
 *                   rank: 1
 *                   price: 95000.00
 *                   marketCap: 1870000000000
 *       400:
 *         description: Bad request - Invalid parameters
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
router.get(
  "/coins",
  async (
    req: Request<unknown, unknown, unknown, CoinsQueryParams>,
    res: Response<CoinStatsResponse | ErrorResponse>
  ) => {
    const {
      page = "1",
      limit = "20",
      coinIds,
      currency = "USD",
      name,
      symbol,
      blockchains,
      includeRiskScore,
      categories,
      sortBy = "marketCap",
      sortDir = "desc",
    } = req.query;

    // Validate sortBy parameter
    const validSortBy: SortByOptions[] = [
      "rank",
      "marketCap",
      "price",
      "volume",
      "priceChange1h",
      "priceChange1d",
      "priceChange7d",
      "name",
      "symbol",
    ];
    if (sortBy && !validSortBy.includes(sortBy as SortByOptions)) {
      return res.status(400).json({
        error: `Invalid sortBy parameter. Valid options: ${validSortBy.join(
          ", "
        )}`,
      });
    }

    // Validate sortDir parameter
    const validSortDir: SortDirOptions[] = ["asc", "desc"];
    if (sortDir && !validSortDir.includes(sortDir as SortDirOptions)) {
      return res.status(400).json({
        error: `Invalid sortDir parameter. Valid options: ${validSortDir.join(
          ", "
        )}`,
      });
    }

    // Build cache key from all parameters
    const cacheKey = `crypto:coins:${page}:${limit}:${
      coinIds || ""
    }:${currency}:${name || ""}:${symbol || ""}:${blockchains || ""}:${
      includeRiskScore || ""
    }:${categories || ""}:${sortBy}:${sortDir}`;

    log(
      "info",
      `Crypto coins request - page: ${page}, limit: ${limit}, currency: ${currency} from ${req.ip}`
    );

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsResponse>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto coins`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto coins`);
    }

    try {
      const params: Record<string, string> = {
        page,
        limit,
        currency,
        sortBy,
        sortDir,
      };

      // Add optional parameters
      if (coinIds) params.coinIds = coinIds;
      if (name) params.name = name;
      if (symbol) params.symbol = symbol;
      if (blockchains) params.blockchains = blockchains;
      if (includeRiskScore) params.includeRiskScore = includeRiskScore;
      if (categories) params.categories = categories;

      const result = await fetchFromCoinStats<CoinStatsResponse>(
        "/coins",
        params
      );

      log(
        "debug",
        `Crypto coins: ${result.result?.length || 0} coins retrieved`
      );

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsResponse>(cacheKey, result, CACHE_TTL_SHORT);
        log("debug", `Cached crypto coins with ${CACHE_TTL_SHORT}s TTL`);
      }

      res.json(result);
    } catch (err) {
      handleCryptoError(res, "coins", err);
    }
  }
);

// ============================================================================
// Single Coin by ID Endpoint
// ============================================================================

/**
 * @swagger
 * /crypto/coins/{coinId}:
 *   get:
 *     summary: Get a specific cryptocurrency by ID
 *     description: Retrieve detailed data for a specific cryptocurrency
 *     tags: [Crypto]
 *     parameters:
 *       - in: path
 *         name: coinId
 *         required: true
 *         description: The unique identifier of the cryptocurrency
 *         schema:
 *           type: string
 *         example: "bitcoin"
 *       - in: query
 *         name: currency
 *         description: The currency to display coin prices in
 *         schema:
 *           type: string
 *           default: "USD"
 *         example: "USD"
 *     responses:
 *       200:
 *         description: Cryptocurrency data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoinStatsCoin'
 *       404:
 *         description: Coin not found
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
router.get(
  "/coins/:coinId",
  async (
    req: Request<{ coinId: string }, unknown, unknown, { currency?: string }>,
    res: Response<CoinStatsCoin | ErrorResponse>
  ) => {
    const { coinId } = req.params;
    const { currency = "USD" } = req.query;

    const cacheKey = `crypto:coin:${coinId}:${currency}`;

    log("info", `Crypto coin request for ${coinId} from ${req.ip}`);

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsCoin>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto coin: ${coinId}`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto coin: ${coinId}`);
    }

    try {
      // Fetch the specific coin by ID
      const result = await fetchFromCoinStats<CoinStatsResponse>("/coins", {
        coinIds: coinId,
        currency,
        limit: "1",
      });

      if (!result.result || result.result.length === 0) {
        return res.status(404).json({
          error: `Cryptocurrency '${coinId}' not found`,
        });
      }

      const coin = result.result[0];

      log("debug", `Crypto coin: ${coinId} retrieved successfully`);

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsCoin>(cacheKey, coin, CACHE_TTL_SHORT);
        log(
          "debug",
          `Cached crypto coin ${coinId} with ${CACHE_TTL_SHORT}s TTL`
        );
      }

      res.json(coin);
    } catch (err) {
      handleCryptoError(res, "coin", err);
    }
  }
);

// ============================================================================
// Market Data Endpoint
// ============================================================================

/**
 * @swagger
 * /crypto/market:
 *   get:
 *     summary: Get global cryptocurrency market data
 *     description: Retrieve global cryptocurrency market statistics including total market cap, trading volume, and Bitcoin dominance
 *     tags: [Crypto]
 *     responses:
 *       200:
 *         description: Global cryptocurrency market data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoinStatsMarketData'
 *             example:
 *               marketCap: 4026535943695
 *               volume: 98765432101
 *               btcDominance: 42.5
 *               marketCapChange: -2.34
 *               volumeChange: 5.67
 *               btcDominanceChange: 0.89
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/market",
  async (req: Request, res: Response<CoinStatsMarketData | ErrorResponse>) => {
    const cacheKey = "crypto:market";

    log("info", `Crypto market data request from ${req.ip}`);

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsMarketData>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto market data`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto market data`);
    }

    try {
      const result = await fetchFromCoinStats<CoinStatsMarketData>("/markets");

      log(
        "debug",
        `Crypto market data retrieved: marketCap $${
          result.marketCap?.toLocaleString() || "N/A"
        }`
      );

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsMarketData>(cacheKey, result, CACHE_TTL_SHORT);
        log("debug", `Cached crypto market data with ${CACHE_TTL_SHORT}s TTL`);
      }

      res.json(result);
    } catch (err) {
      handleCryptoError(res, "market", err);
    }
  }
);

export default router;

// Export for testing
export { fetchFromCoinStats, handleCryptoError };
