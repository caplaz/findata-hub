/**
 * News Reader Routes module
 * Handles article scraping from Yahoo Finance
 * @module routes/newsReader
 */

import { Router } from "express";
import axios from "axios";
import { load as cheerioLoad } from "cheerio";
import https from "https";
import { get } from "https";
import { cache, CACHE_ENABLED } from "../config/cache.js";
import { log } from "../utils/logger.js";

const router = Router();

// ============================================================================
// News Reader Endpoint
// ============================================================================

/**
 * @swagger
 * /news_reader/{slug}:
 *   get:
 *     summary: Extract article content from Yahoo Finance news
 *     description: Scrape and extract the main title and text content from a Yahoo Finance news article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: The article slug from the Yahoo Finance URL (e.g., bitcoin-price-under-pressure-slips-below-92000-as-self-fulfilling-prophecy-puts-4-year-cycle-in-focus-203113535.html)
 *         schema:
 *           type: string
 *         example: "bitcoin-price-under-pressure-slips-below-92000-as-self-fulfilling-prophecy-puts-4-year-cycle-in-focus-203113535.html"
 *     responses:
 *       200:
 *         description: Article content extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   description: The article title
 *                 content:
 *                   type: string
 *                   description: The main article text content
 *                 url:
 *                   type: string
 *                   description: The full article URL
 *             example:
 *               title: "Bitcoin Price Under Pressure, Slips Below $92,000 as Self-Fulfilling Prophecy Puts 4-Year Cycle in Focus"
 *               content: "Bitcoin (BTC) fell below $92,000 on Tuesday, extending its decline from the all-time high of $100,000 reached earlier this month..."
 *               url: "https://finance.yahoo.com/news/bitcoin-price-under-pressure-slips-below-92000-as-self-fulfilling-prophecy-puts-4-year-cycle-in-focus-203113535.html"
 *       404:
 *         description: Article not found or unable to extract content
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
router.get("/news_reader/:slug", async (req, res) => {
  const slug = req.params.slug;
  const url = `https://finance.yahoo.com/news/${slug}`;
  const cacheKey = `news_reader:${slug}`;

  log("info", `News reader request for ${url} from ${req.ip}`);

  if (CACHE_ENABLED) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log("debug", `Cache hit for news reader: ${slug}`);
      return res.json(cached);
    }
    log("debug", `Cache miss for news reader: ${slug}`);
  }

  try {
    log("debug", `Fetching article content from ${url}`);

    // Fetch the HTML content using native https module
    const response = await new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
        maxHeaderSize: 131072, // 128KB header limit
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ data, status: res.statusCode });
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.end();
    });

    if (response.status !== 200) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    const $ = cheerioLoad(response.data);

    // Extract title - try multiple selectors
    let title = $("h1").first().text().trim();
    if (!title) {
      title = $("h1.caas-title").text().trim();
    }
    if (!title) {
      title = $("title").text().trim();
    }

    // Extract main content - try multiple selectors
    let content = "";

    // Try the main article body
    const bodySelectors = [
      "div.caas-body",
      'div[data-testid="article-body"]',
      "div.article-body",
      "div.content",
      "article",
    ];

    for (const selector of bodySelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Get all paragraphs within the body
        const paragraphs = element
          .find("p")
          .map((i, el) => $(el).text().trim())
          .get();
        content = paragraphs.join("\n\n");
        if (content) break;
      }
    }

    // Fallback: get all paragraphs if no specific body found
    if (!content) {
      const allParagraphs = $("p")
        .map((i, el) => $(el).text().trim())
        .get();
      content = allParagraphs.slice(0, 20).join("\n\n"); // Limit to first 20 paragraphs
    }

    if (!title || !content) {
      log("warn", `Unable to extract content from ${url}`);
      return res.status(404).json({
        error:
          "Unable to extract article content. The article may not exist or the page structure has changed.",
      });
    }

    const result = {
      title,
      content,
      url,
    };

    if (CACHE_ENABLED) {
      cache.set(cacheKey, result);
      log("debug", `Cached article content for ${slug}`);
    }

    res.json(result);
  } catch (err) {
    log("error", `News reader error for "${slug}": ${err.message}`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
