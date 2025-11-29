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
  CoinStatsBtcDominanceResponse,
  CoinStatsFearGreedResponse,
  CoinStatsRainbowChartResponse,
  CoinStatsNewsResponse,
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

// ============================================================================
// Insights Endpoints
// ============================================================================

/**
 * @swagger
 * /crypto/insights/btc-dominance:
 *   get:
 *     summary: Get Bitcoin dominance data
 *     description: Retrieve Bitcoin's market dominance percentage over time
 *     tags: [Crypto]
 *     parameters:
 *       - in: query
 *         name: type
 *         description: Time period for the data
 *         schema:
 *           type: string
 *           enum: [24h, 1w, 1m, 3m, 6m, 1y, all]
 *           default: "1y"
 *         example: "1y"
 *     responses:
 *       200:
 *         description: Bitcoin dominance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - type: number
 *                         - type: number
 *                     description: "[timestamp, btcDominancePercentage]"
 *             example:
 *               data:
 *                 - [1746441300, 61.59]
 *                 - [1746441400, 62.1]
 *                 - [1746441500, 61.85]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/insights/btc-dominance",
  async (
    req: Request,
    res: Response<CoinStatsBtcDominanceResponse | ErrorResponse>
  ) => {
    const { type = "1y" } = req.query;

    // Validate type parameter
    const validTypes = ["24h", "1w", "1m", "3m", "6m", "1y", "all"];
    if (typeof type !== "string" || !validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid type parameter. Valid options: ${validTypes.join(
          ", "
        )}`,
      });
    }

    const cacheKey = `crypto:insights:btc-dominance:${type}`;

    log(
      "info",
      `Crypto BTC dominance request for type: ${type} from ${req.ip}`
    );

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsBtcDominanceResponse>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto BTC dominance: ${type}`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto BTC dominance: ${type}`);
    }

    try {
      const result = await fetchFromCoinStats<CoinStatsBtcDominanceResponse>(
        "/insights/btc-dominance",
        { type }
      );

      log(
        "debug",
        `Crypto BTC dominance: ${
          result.data?.length || 0
        } data points retrieved`
      );

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsBtcDominanceResponse>(
          cacheKey,
          result,
          CACHE_TTL_SHORT
        );
        log(
          "debug",
          `Cached crypto BTC dominance ${type} with ${CACHE_TTL_SHORT}s TTL`
        );
      }

      res.json(result);
    } catch (err) {
      handleCryptoError(res, "btc-dominance", err);
    }
  }
);

/**
 * @swagger
 * /crypto/insights/fear-greed:
 *   get:
 *     summary: Get Fear and Greed Index
 *     description: Retrieve the current Crypto Fear & Greed Index with historical data
 *     tags: [Crypto]
 *     responses:
 *       200:
 *         description: Fear and Greed Index data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 now:
 *                   $ref: '#/components/schemas/CoinStatsFearGreedDataPoint'
 *                 yesterday:
 *                   $ref: '#/components/schemas/CoinStatsFearGreedDataPoint'
 *                 lastWeek:
 *                   $ref: '#/components/schemas/CoinStatsFearGreedDataPoint'
 *             example:
 *               name: "Fear and Greed Index"
 *               now:
 *                 value: 73
 *                 value_classification: "Greed"
 *                 timestamp: 1747052304
 *                 update_time: "2025-05-12T12:08:10.020Z"
 *               yesterday:
 *                 value: 73
 *                 value_classification: "Greed"
 *                 timestamp: 1747052304
 *               lastWeek:
 *                 value: 73
 *                 value_classification: "Greed"
 *                 timestamp: 1747052304
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/insights/fear-greed",
  async (
    req: Request,
    res: Response<CoinStatsFearGreedResponse | ErrorResponse>
  ) => {
    const cacheKey = "crypto:insights:fear-greed";

    log("info", `Crypto Fear and Greed Index request from ${req.ip}`);

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsFearGreedResponse>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto Fear and Greed Index`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto Fear and Greed Index`);
    }

    try {
      const result = await fetchFromCoinStats<CoinStatsFearGreedResponse>(
        "/insights/fear-and-greed"
      );

      log("debug", `Crypto Fear and Greed Index retrieved: ${result.name}`);

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsFearGreedResponse>(
          cacheKey,
          result,
          CACHE_TTL_SHORT
        );
        log(
          "debug",
          `Cached crypto Fear and Greed Index with ${CACHE_TTL_SHORT}s TTL`
        );
      }

      res.json(result);
    } catch (err) {
      handleCryptoError(res, "fear-greed", err);
    }
  }
);

/**
 * @swagger
 * /crypto/insights/rainbow-chart/{coinId}:
 *   get:
 *     summary: Get Rainbow Chart data
 *     description: Retrieve Rainbow Chart data for Bitcoin or Ethereum
 *     tags: [Crypto]
 *     parameters:
 *       - in: path
 *         name: coinId
 *         required: true
 *         description: The coin identifier (bitcoin or ethereum)
 *         schema:
 *           type: string
 *           enum: [bitcoin, ethereum]
 *         example: "bitcoin"
 *     responses:
 *       200:
 *         description: Rainbow Chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   price:
 *                     type: string
 *                   time:
 *                     type: string
 *             example:
 *               - price: "0.9111"
 *                 time: "2010-09-30"
 *               - price: "1.2345"
 *                 time: "2010-10-01"
 *       400:
 *         description: Invalid coin ID
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
  "/insights/rainbow-chart/:coinId",
  async (
    req: Request<{ coinId: string }>,
    res: Response<CoinStatsRainbowChartResponse | ErrorResponse>
  ) => {
    const { coinId } = req.params;

    // Validate coinId parameter
    const validCoinIds = ["bitcoin", "ethereum"];
    if (!validCoinIds.includes(coinId)) {
      return res.status(400).json({
        error: `Invalid coinId parameter. Valid options: ${validCoinIds.join(
          ", "
        )}`,
      });
    }

    const cacheKey = `crypto:insights:rainbow-chart:${coinId}`;

    log("info", `Crypto Rainbow Chart request for ${coinId} from ${req.ip}`);

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsRainbowChartResponse>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto Rainbow Chart: ${coinId}`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto Rainbow Chart: ${coinId}`);
    }

    try {
      const result = await fetchFromCoinStats<CoinStatsRainbowChartResponse>(
        `/insights/rainbow-chart/${coinId}`
      );

      log(
        "debug",
        `Crypto Rainbow Chart: ${
          result?.length || 0
        } data points retrieved for ${coinId}`
      );

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsRainbowChartResponse>(
          cacheKey,
          result,
          CACHE_TTL_SHORT
        );
        log(
          "debug",
          `Cached crypto Rainbow Chart ${coinId} with ${CACHE_TTL_SHORT}s TTL`
        );
      }

      res.json(result);
    } catch (err) {
      handleCryptoError(res, "rainbow-chart", err);
    }
  }
);

// ============================================================================
// News Endpoint
// ============================================================================

/**
 * @swagger
 * /crypto/news:
 *   get:
 *     summary: Get cryptocurrency news by type
 *     description: Retrieve cryptocurrency news articles filtered by type (handpicked, trending, latest, bullish, bearish)
 *     tags: [Crypto]
 *     parameters:
 *       - in: query
 *         name: type
 *         description: Type of news to retrieve
 *         schema:
 *           type: string
 *           enum: [handpicked, trending, latest, bullish, bearish]
 *           default: "latest"
 *         example: "latest"
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
 *     responses:
 *       200:
 *         description: Cryptocurrency news articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the news article
 *                   feedDate:
 *                     type: number
 *                     description: Unix timestamp when the news was published
 *                   source:
 *                     type: string
 *                     description: Name of the news source
 *                   title:
 *                     type: string
 *                     description: Title of the news article
 *                   isFeatured:
 *                     type: boolean
 *                     description: Whether this news item is featured
 *                   link:
 *                     type: string
 *                     description: Direct link to the full news article
 *                   sourceLink:
 *                     type: string
 *                     description: URL of the news source website
 *                   imgUrl:
 *                     type: string
 *                     description: URL of the article image
 *                   reactionsCount:
 *                     type: object
 *                     description: Count of different reaction types
 *                   reactions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of reaction identifiers
 *                   shareURL:
 *                     type: string
 *                     description: Shareable URL for this news item
 *                   relatedCoins:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of related cryptocurrency identifiers
 *                   content:
 *                     type: boolean
 *                     description: Whether full content is available
 *                   bigImg:
 *                     type: boolean
 *                     description: Whether to display with large image
 *                   searchKeyWords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of search keywords
 *                   description:
 *                     type: string
 *                     description: Brief description of the news article
 *                   coins:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         coinKeyWords:
 *                           type: string
 *                         coinPercent:
 *                           type: number
 *                         coinTitleKeyWords:
 *                           type: string
 *                         coinNameKeyWords:
 *                           type: string
 *                         coinIdKeyWords:
 *                           type: string
 *             example:
 *               - id: "376f390df50a1d44cb5593c9bff6faafabed18ee90e0d4d737d3b6d3eea50c80"
 *                 feedDate: 1756204736000
 *                 source: "CoinGape"
 *                 title: "Why is XRP Price Down Even After the Ripple Lawsuit End?"
 *                 isFeatured: false
 *                 link: "https://coingape.com/trending/why-is-xrp-price-down-even-after-the-ripple-lawsuit-end/"
 *                 sourceLink: "https://coingape.com/"
 *                 imgUrl: "https://coingape.com/wp-content/uploads/2025/08/Why-is-XRP-Price-Down.webp"
 *                 reactionsCount: {"2": 13, "3": 18}
 *                 reactions: []
 *                 shareURL: "https://coinstats.app/news/376f390df50a1d44cb5593c9bff6faafabed18ee90e0d4d737d3b6d3eea50c80_Why-is-XRP-Price-Down-Even-After-the-Ripple-Lawsuit-End"
 *                 relatedCoins: ["ripple", "0xb9ce0dd29c91e02d4620f57a66700fc5e41d6d15_cronos"]
 *                 content: true
 *                 bigImg: false
 *                 searchKeyWords: ["xrp", "XRP"]
 *                 description: "coingape.com."
 *                 coins: [{"coinKeyWords": "XRP", "coinPercent": -5.11, "coinTitleKeyWords": "XRP", "coinNameKeyWords": "XRP", "coinIdKeyWords": "ripple"}]
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
  "/news",
  async (
    req: Request<
      unknown,
      unknown,
      unknown,
      { type?: string; page?: string; limit?: string }
    >,
    res: Response<CoinStatsNewsResponse | ErrorResponse>
  ) => {
    const { type = "latest", page = "1", limit = "20" } = req.query;

    // Validate type parameter
    const validTypes = [
      "handpicked",
      "trending",
      "latest",
      "bullish",
      "bearish",
    ];
    if (typeof type !== "string" || !validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid type parameter. Valid options: ${validTypes.join(
          ", "
        )}`,
      });
    }

    // Validate page parameter
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: "Invalid page parameter. Must be a positive integer.",
      });
    }

    // Validate limit parameter
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: "Invalid limit parameter. Must be between 1 and 100.",
      });
    }

    const cacheKey = `crypto:news:${type}:${page}:${limit}`;

    log(
      "info",
      `Crypto news request - type: ${type}, page: ${page}, limit: ${limit} from ${req.ip}`
    );

    if (CACHE_ENABLED) {
      const cached = await cache.get<CoinStatsNewsResponse>(cacheKey);
      if (cached) {
        log("debug", `Cache hit for crypto news: ${type}`);
        return res.json(cached);
      }
      log("debug", `Cache miss for crypto news: ${type}`);
    }

    try {
      const params: Record<string, string> = {
        page,
        limit,
      };

      const result = await fetchFromCoinStats<CoinStatsNewsResponse>(
        `/news/type/${type}`,
        params
      );

      log(
        "debug",
        `Crypto news: ${
          result?.length || 0
        } articles retrieved for type: ${type}`
      );

      if (CACHE_ENABLED) {
        await cache.set<CoinStatsNewsResponse>(
          cacheKey,
          result,
          CACHE_TTL_SHORT
        );
        log("debug", `Cached crypto news ${type} with ${CACHE_TTL_SHORT}s TTL`);
      }

      res.json(result);
    } catch (err) {
      handleCryptoError(res, "news", err);
    }
  }
);

export default router;
