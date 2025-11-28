/**
 * Ticker Routes module
 * Consolidated ticker-specific endpoints
 * @module routes/ticker
 */

import { Router, Request, Response } from "express";

import { cache, CACHE_ENABLED } from "../config/cache";
import type {
  QuoteSummaryResult,
  ErrorResponse,
  SearchNews,
  RecommendationsBySymbolResponse,
} from "../types";
import { log } from "../utils/logger";
import yahooFinance from "../yahoo";

const router = Router();

// ============================================================================
// Route Types
// ============================================================================

interface TickerRouteParams {
  ticker: string;
}

interface FinancialQueryParams {
  period?: "annual" | "quarterly";
}

interface NewsQueryParams {
  count?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate if a ticker symbol appears to be valid
 */
function isValidSymbol(symbol: string): boolean {
  // Basic validation: 1-10 characters, letters/numbers/dots only, no underscores
  return /^[A-Z0-9.]{1,10}$/.test(symbol) && !symbol.includes("_");
}

/**
 * Handle standardized error responses for ticker endpoints
 */
function handleTickerError(
  res: Response<ErrorResponse>,
  ticker: string,
  endpointName: string,
  err: unknown,
  additionalErrorChecks: string[] = []
): void {
  const errorMessage = err instanceof Error ? err.message : String(err);
  log(
    "error",
    `Ticker ${endpointName} endpoint error for ${ticker}: ${errorMessage}`,
    err
  );

  // Check for invalid symbol errors (404) or other errors (500)
  const invalidSymbolPatterns = [
    "No fundamentals data found for symbol",
    "Quote not found for symbol",
    ...additionalErrorChecks,
  ];

  const isInvalidSymbol = invalidSymbolPatterns.some((pattern) =>
    errorMessage.includes(pattern)
  );

  if (isInvalidSymbol) {
    res.status(404).json({ error: `Symbol '${ticker}' not found or invalid` });
  } else {
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get company info for a single ticker
 */
async function getTickerInfo(ticker: string): Promise<QuoteSummaryResult> {
  const cacheKey = `ticker:info:${ticker}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<QuoteSummaryResult>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker info: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching company info for ${ticker}`);
  const result = await yahooFinance.quoteSummary(ticker, {
    modules: ["assetProfile"],
  });

  if (CACHE_ENABLED) {
    await cache.set<QuoteSummaryResult>(cacheKey, result);
  }

  return result;
}

/**
 * Get financial statements for a ticker
 */
async function getTickerFinancials(
  ticker: string,
  type: "income" | "balance" | "cashflow",
  period: "annual" | "quarterly" = "annual"
): Promise<QuoteSummaryResult> {
  const moduleMap: Record<string, string> = {
    income: "incomeStatementHistory",
    balance: "balanceSheetHistory",
    cashflow: "cashflowStatementHistory",
  };

  if (!moduleMap[type]) {
    throw new Error(
      `Invalid financial type: ${type}. Must be 'income', 'balance', or 'cashflow'`
    );
  }

  const cacheKey = `ticker:financial:${ticker}:${type}:${period}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<QuoteSummaryResult>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker financial: ${ticker}:${type}`);
      return cached;
    }
  }

  log("debug", `Fetching ${period} ${type} for ${ticker}`);

  const moduleName = moduleMap[type];
  const options: Record<string, string[]> = {
    modules: [moduleName],
  };

  const result = await yahooFinance.quoteSummary(ticker, options);

  if (CACHE_ENABLED) {
    await cache.set<QuoteSummaryResult>(cacheKey, result);
  }

  return result;
}

/**
 * Get holdings for a ticker
 */
async function getTickerHoldings(ticker: string): Promise<QuoteSummaryResult> {
  const cacheKey = `ticker:holdings:${ticker}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<QuoteSummaryResult>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker holdings: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching holdings for ${ticker}`);

  try {
    const result = await yahooFinance.quoteSummary(ticker, {
      modules: ["topHoldings", "fundProfile"],
    });

    if (CACHE_ENABLED) {
      await cache.set<QuoteSummaryResult>(cacheKey, result);
    }

    return result;
  } catch (error) {
    log(
      "warn",
      `Holdings fetch failed for ${ticker}, trying fallback: ${
        (error as Error).message
      }`
    );
    // Fallback to basic quote data
    const fallback = await yahooFinance.quote(ticker);
    return fallback as unknown as QuoteSummaryResult;
  }
}

/**
 * Get insights for a ticker
 */
async function getTickerInsights(ticker: string): Promise<QuoteSummaryResult> {
  const cacheKey = `ticker:insights:${ticker}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<QuoteSummaryResult>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker insights: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching insights for ${ticker}`);

  const result = await yahooFinance.quoteSummary(ticker, {
    modules: [
      "recommendationTrend",
      "upgradeDowngradeHistory",
      "insiderTransactions",
      "insiderHolders",
    ],
  });

  if (CACHE_ENABLED) {
    await cache.set<QuoteSummaryResult>(cacheKey, result);
  }

  return result;
}

/**
 * Get news for a ticker
 */
async function getTickerNews(
  ticker: string,
  count: number = 10
): Promise<SearchNews[]> {
  const limitedCount = Math.min(count || 10, 50);
  const cacheKey = `ticker:news:${ticker}:${limitedCount}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<SearchNews[]>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker news: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching news for ${ticker}`);

  const searchResult = await yahooFinance.search(ticker, {
    newsCount: limitedCount,
  });

  const result = searchResult.news || [];

  if (CACHE_ENABLED) {
    await cache.set<SearchNews[]>(cacheKey, result);
  }

  return result;
}

/**
 * Get calendar events for a ticker
 */
async function getTickerEvents(ticker: string): Promise<QuoteSummaryResult> {
  const cacheKey = `ticker:events:${ticker}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<QuoteSummaryResult>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker events: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching calendar events for ${ticker}`);

  const result = await yahooFinance.quoteSummary(ticker, {
    modules: ["calendarEvents", "earnings", "earningsHistory"],
  });

  if (CACHE_ENABLED) {
    await cache.set<QuoteSummaryResult>(cacheKey, result);
  }

  return result;
}

/**
 * Get key statistics for a ticker
 */
async function getTickerStatistics(
  ticker: string
): Promise<QuoteSummaryResult> {
  const cacheKey = `ticker:statistics:${ticker}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<QuoteSummaryResult>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker statistics: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching key statistics for ${ticker}`);

  const result = await yahooFinance.quoteSummary(ticker, {
    modules: ["defaultKeyStatistics", "financialData"],
  });

  if (CACHE_ENABLED) {
    await cache.set<QuoteSummaryResult>(cacheKey, result);
  }

  return result;
}

/**
 * Get recommendations for a ticker
 */
async function getTickerRecommendations(
  ticker: string
): Promise<RecommendationsBySymbolResponse> {
  const cacheKey = `recommendations:${ticker}`;

  if (CACHE_ENABLED) {
    const cached = await cache.get<RecommendationsBySymbolResponse>(cacheKey);
    if (cached) {
      log("debug", `Cache hit for ticker recommendations: ${ticker}`);
      return cached;
    }
  }

  log("debug", `Fetching recommendations for ${ticker}`);

  const result = await yahooFinance.recommendationsBySymbol(ticker);

  if (CACHE_ENABLED) {
    await cache.set<RecommendationsBySymbolResponse>(cacheKey, result);
  }

  return result;
}

// ============================================================================
// Endpoints
// ============================================================================

/**
 * @swagger
 * /ticker/{ticker}/holdings:
 *   get:
 *     summary: Get holdings data
 *     description: Retrieve holdings and composition data for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol (ETF or mutual fund)
 *         schema:
 *           type: string
 *         example: "SPY"
 *     responses:
 *       200:
 *         description: Holdings data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HoldingsData'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker/holdings",
  async (
    req: Request<TickerRouteParams>,
    res: Response<QuoteSummaryResult | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker holdings request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerHoldings(ticker);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "holdings", err);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}/insights:
 *   get:
 *     summary: Get stock insights
 *     description: Retrieve comprehensive insights and analysis for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: Stock insights
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsightsData'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker/insights",
  async (
    req: Request<TickerRouteParams>,
    res: Response<QuoteSummaryResult | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker insights request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerInsights(ticker);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "insights", err);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}/news:
 *   get:
 *     summary: Get news for a ticker
 *     description: Retrieve latest news articles for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *       - in: query
 *         name: count
 *         description: Number of news articles to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: News articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchNews'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker/news",
  async (
    req: Request<TickerRouteParams, SearchNews[], unknown, NewsQueryParams>,
    res: Response<SearchNews[] | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();
    const count = parseInt(req.query.count || "10", 10);

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker news request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerNews(ticker, count);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "news", err, [
        "Missing required query parameter",
      ]);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}/events:
 *   get:
 *     summary: Get calendar events for a ticker
 *     description: Retrieve important dates and events for a ticker including earnings dates, dividend dates, and earnings estimates
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: Calendar events and important dates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarEvents'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker/events",
  async (
    req: Request<TickerRouteParams>,
    res: Response<QuoteSummaryResult | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker events request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerEvents(ticker);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "events", err);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}/statistics:
 *   get:
 *     summary: Get key statistics for a ticker
 *     description: Retrieve key financial statistics and metrics for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: Key statistics and financial metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KeyStatistics'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker/statistics",
  async (
    req: Request<TickerRouteParams>,
    res: Response<QuoteSummaryResult | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker statistics request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerStatistics(ticker);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "statistics", err);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}/recommendations:
 *   get:
 *     summary: Get similar stock recommendations
 *     description: Retrieve recommended similar stocks for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: Stock recommendations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationsResult'
 *             example:
 *               symbol: "AAPL"
 *               recommendedSymbols: [{"symbol": "MSFT", "score": 0.9999}]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker/recommendations",
  async (
    req: Request<TickerRouteParams>,
    res: Response<RecommendationsBySymbolResponse | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker recommendations request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerRecommendations(ticker);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "recommendations", err);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}/{type}:
 *   get:
 *     summary: Get financial statements
 *     description: Retrieve financial statements for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *       - in: path
 *         name: type
 *         required: true
 *         description: Type of financial statement
 *         schema:
 *           type: string
 *           enum: [income, balance, cashflow]
 *       - in: query
 *         name: period
 *         description: Time period for financial data
 *         schema:
 *           type: string
 *           enum: [annual, quarterly]
 *           default: "annual"
 *     responses:
 *       200:
 *         description: Financial statement data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialData'
 *       400:
 *         description: Invalid statement type or period
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
  "/:ticker/:type",
  async (
    req: Request<
      TickerRouteParams & { type: string },
      Record<string, unknown>,
      unknown,
      FinancialQueryParams
    >,
    res: Response<QuoteSummaryResult | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();
    const type = req.params.type.toLowerCase();
    const period = (req.query.period || "annual") as "annual" | "quarterly";

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log(
      "info",
      `Ticker financial request for: ${ticker}/${type} from ${req.ip}`
    );

    // Validate type
    if (!["income", "balance", "cashflow"].includes(type)) {
      log("warn", `Invalid financial type requested: ${type}`);
      return res.status(400).json({
        error: `Invalid statement type: ${type}. Must be 'income', 'balance', or 'cashflow'`,
      });
    }

    // Validate period
    if (!["annual", "quarterly"].includes(period)) {
      log("warn", `Invalid period requested: ${period}`);
      return res.status(400).json({
        error: `Invalid period: ${period}. Must be 'annual' or 'quarterly'`,
      });
    }

    try {
      const result = await getTickerFinancials(
        ticker,
        type as "income" | "balance" | "cashflow",
        period
      );
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "financial", err);
    }
  }
);

/**
 * @swagger
 * /ticker/{ticker}:
 *   get:
 *     summary: Get company information
 *     description: Retrieve company information and profile for a ticker
 *     tags: [Ticker]
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         description: Stock ticker symbol
 *         schema:
 *           type: string
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: Company information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyInfo'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:ticker",
  async (
    req: Request<TickerRouteParams>,
    res: Response<QuoteSummaryResult | ErrorResponse>
  ) => {
    const ticker = req.params.ticker.toUpperCase();

    // Validate symbol format
    if (!isValidSymbol(ticker)) {
      return res
        .status(404)
        .json({ error: `Symbol '${ticker}' not found or invalid` });
    }

    log("info", `Ticker info request for: ${ticker} from ${req.ip}`);

    try {
      const result = await getTickerInfo(ticker);
      res.json(result);
    } catch (err) {
      handleTickerError(res, ticker, "info", err);
    }
  }
);

export default router;

// Export for testing
export { handleTickerError };
