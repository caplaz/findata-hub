/**
 * News Routes module
 * News and press release endpoints
 * @module routes/news
 */

import { Router } from "express";
import yahooFinance from "../yahoo.js";
import { cache, CACHE_ENABLED } from "../config/cache.js";
import { log } from "../utils/logger.js";

const router = Router();

// ============================================================================
// News Endpoint
// ============================================================================

/**
 * @swagger
 * /news/{symbol}:
 *   get:
 *     summary: Get news for a symbol
 *     description: Retrieve latest news articles for a specific stock symbol
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         description: Stock symbol
 *         schema:
 *           type: string
 *           example: "AAPL"
 *       - in: query
 *         name: count
 *         description: Number of news articles to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         example: 10
 *     responses:
 *       200:
 *         description: News articles for the symbol
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsResult'
 *             example:
 *               data: [{"title": "Apple announces new product", "link": "https://..."}]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const count = parseInt(req.query.count) || 10;
  const cacheKey = `news:${symbol}:${count}`;

  log("info", `News request for ${symbol}, count: ${count} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for news: ${symbol}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for news: ${symbol}`);
  }

  try {
    // Get news using search API
    const searchResult = await yahooFinance.search(symbol, {
      newsCount: count,
    });

    // Get company info and asset profile which provides context
    const info = await yahooFinance.quoteSummary(symbol, {
      modules: ["assetProfile", "summaryProfile"],
    });

    // Format news articles
    const newsArticles = (searchResult.news || []).map((article) => ({
      title: article.title,
      publisher: article.publisher,
      link: article.link,
      publishedAt: article.providerPublishTime,
      type: article.type,
      thumbnail: article.thumbnail,
      relatedTickers: article.relatedTickers,
    }));

    const response = {
      symbol,
      count: newsArticles.length,
      news: newsArticles,
      companyInfo: {
        longName: info.assetProfile?.longName,
        sector: info.assetProfile?.sector,
        industry: info.assetProfile?.industry,
        website: info.assetProfile?.website,
        description: info.assetProfile?.longBusinessSummary,
      },
      summaryInfo: {
        previousClose: info.summaryProfile?.previousClose?.raw,
        marketCap: info.summaryProfile?.marketCap?.raw,
        trailingPE: info.summaryProfile?.trailingPE?.raw,
        forwardPE: info.summaryProfile?.forwardPE?.raw,
      },
      message:
        newsArticles.length > 0
          ? `Found ${newsArticles.length} news articles for ${symbol}`
          : `No recent news found for ${symbol}. Live news streaming is available through Yahoo Finance web interface.`,
      dataAvailable: {
        hasAssetProfile: !!info.assetProfile,
        hasSummaryProfile: !!info.summaryProfile,
        hasNews: newsArticles.length > 0,
      },
    };

    if (CACHE_ENABLED) {
      cache.set(cacheKey, response);
      log("debug", `Cached news context for ${symbol}`);
    }

    res.json(response);
  } catch (err) {
    log("error", `News endpoint error for "${symbol}": ${err.message}`, err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// General News Endpoint
// ============================================================================

/**
 * @swagger
 * /news:
 *   get:
 *     summary: Get general market news
 *     description: Retrieve latest general market news articles
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: count
 *         description: Number of news articles to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         example: 10
 *     responses:
 *       200:
 *         description: General market news articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsResult'
 *             example:
 *               data: [{"title": "Market update", "link": "https://..."}]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const cacheKey = `news_general:${count}`;

  log("info", `General news request, count: ${count} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for general news`);
      return res.json(cached);
    }
    log("debug", `Cache miss for general news`);
  }

  try {
    // Use a broad search to get general market news
    const result = await yahooFinance.search("", { newsCount: count });

    // Format news articles
    const newsArticles = (result.news || []).map((article) => ({
      title: article.title,
      publisher: article.publisher,
      link: article.link,
      publishedAt: article.providerPublishTime,
      type: article.type,
      thumbnail: article.thumbnail,
      relatedTickers: article.relatedTickers,
    }));

    const response = {
      count: newsArticles.length,
      news: newsArticles,
      message:
        newsArticles.length > 0
          ? `Found ${newsArticles.length} general market news articles`
          : `No recent general market news found.`,
      dataAvailable: {
        hasNews: newsArticles.length > 0,
      },
    };

    if (CACHE_ENABLED) {
      cache.set(cacheKey, response);
      log("debug", `Cached general news`);
    }

    res.json(response);
  } catch (err) {
    log("error", `General news endpoint error: ${err.message}`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
