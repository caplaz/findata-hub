/**
 * MCP Tool Handlers
 * Implementation of all MCP tool handler functions
 *
 * @module mcp/handlers
 */

import { cache, CACHE_ENABLED, CACHE_TTL_SHORT } from "../config/cache";
import type {
  QuoteSummaryResult,
  AssetProfile,
  FinancialData,
  TopHoldings,
  SearchResult,
  TrendingSymbolsResult,
  RecommendationsBySymbolResponse,
  HistoricalHistoryResult,
  FundamentalsTimeSeriesResult,
  FundamentalsTimeSeriesFinancialsResult,
  PredefinedScreenerModules,
} from "../types";
import { log } from "../utils/logger";
import {
  fetchArticleContent,
  extractArticleContent,
} from "../utils/newsScraper";
import yahooFinance from "../yahoo";

/**
 * Summary detail interface for quote summary data
 */
interface SummaryDetail {
  beta?: number;
  forwardPE?: number;
  bookValue?: number;
  priceToBook?: number;
}

// ============================================================================
// Aggregated Tool Handlers
// ============================================================================

/**
 * Handle stock overview requests - combines quote, company info, and key statistics
 */
async function handleGetStockOverview(symbol: string) {
  const cacheKey = `overview:${symbol}`;
  if (CACHE_ENABLED) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      log("debug", `MCP: Cache hit for stock overview: ${symbol}`);
      return cached;
    }
    log("debug", `MCP: Cache miss for stock overview: ${symbol}`);
  }

  try {
    log("debug", `MCP: Fetching comprehensive overview for ${symbol}`);

    // Get quote data
    const quoteResult = await yahooFinance.quote(symbol);
    const quote = Array.isArray(quoteResult) ? quoteResult[0] : quoteResult;

    // Get company info
    const info = (await yahooFinance.quoteSummary(symbol, {
      modules: [
        "assetProfile",
        "recommendationTrend",
        "financialData",
        "summaryDetail",
      ],
    })) as QuoteSummaryResult;

    const profile = (info.assetProfile ||
      info.summaryProfile ||
      {}) as AssetProfile;
    const financial = (info.financialData || {}) as FinancialData;
    const summaryDetail = (info.summaryDetail as SummaryDetail) || {};

    const overview = {
      symbol,
      companyName: profile.longName || symbol,
      currentPrice: quote.regularMarketPrice,
      currency: quote.currency,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      marketCap: quote.marketCap,
      pe: quote.trailingPE,
      dividend: quote.trailingAnnualDividendRate,
      weekHigh52: quote.fiftyTwoWeekHigh,
      weekLow52: quote.fiftyTwoWeekLow,
      averageVolume: quote.averageVolume,
      // Company info
      industry: profile.industry,
      sector: profile.sector,
      website: profile.website,
      businessSummary: profile.longBusinessSummary?.substring(0, 500),
      employees: profile.fullTimeEmployees,
      country: profile.country,
      // Financial metrics
      revenuePerShare: financial.revenuePerShare,
      profitMargins: financial.profitMargins,
      operatingMargins: financial.operatingMargins,
      returnOnEquity: financial.returnOnEquity,
      returnOnAssets: financial.returnOnAssets,
      // Market data
      beta: summaryDetail.beta,
      forwardPE: summaryDetail.forwardPE,
      bookValue: summaryDetail.bookValue,
      priceToBook: summaryDetail.priceToBook,
      // Analyst data
      recommendationMean:
        info.recommendationTrend?.trend?.[0]?.strongBuy || null,
      numberOfAnalysts:
        info.recommendationTrend?.trend?.[0]?.numberOfAnalysts || null,
    };

    if (CACHE_ENABLED) {
      await cache.set(cacheKey, overview, CACHE_TTL_SHORT);
      log("debug", `MCP: Cached stock overview for ${symbol}`);
    }

    return overview;
  } catch (error) {
    throw new Error(`Stock overview tool error: ${error.message}`);
  }
}

/**
 * Handle stock analysis requests - combines recommendations, insights, performance, and news
 */
async function handleGetStockAnalysis(
  symbol: string,
  includeNews = true,
  newsCount = 5
) {
  const cacheKey = `analysis:${symbol}:${includeNews}:${newsCount}`;
  if (CACHE_ENABLED) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      log("debug", `MCP: Cache hit for stock analysis: ${symbol}`);
      return cached;
    }
    log("debug", `MCP: Cache miss for stock analysis: ${symbol}`);
  }

  try {
    log("debug", `MCP: Fetching comprehensive analysis for ${symbol}`);

    // Parallel fetch of multiple data sources
    const promises = [
      // Recommendations
      yahooFinance.recommendationsBySymbol(symbol),
      // Insights (recommendation trends, insider transactions, upgrades)
      yahooFinance.quoteSummary(symbol, {
        modules: [
          "recommendationTrend",
          "upgradeDowngradeHistory",
          "insiderTransactions",
          "insiderHolders",
        ],
      }),
      // Performance analysis
      yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: "1d" as const,
      }),
      // Current quote for performance context
      yahooFinance.quote(symbol),
    ];

    if (includeNews) {
      promises.push(
        yahooFinance.search(symbol, { newsCount: Math.min(newsCount, 20) })
      );
    }

    const [recommendations, insights, history, quoteResult, newsResult] =
      await Promise.allSettled(promises);

    const quote =
      quoteResult.status === "fulfilled"
        ? Array.isArray(quoteResult.value)
          ? quoteResult.value[0]
          : quoteResult.value
        : null;

    // Process recommendations
    const recs =
      recommendations.status === "fulfilled"
        ? {
            count:
              (recommendations.value as RecommendationsBySymbolResponse)
                .recommendedSymbols?.length || 0,
            recommendations: (
              (recommendations.value as RecommendationsBySymbolResponse)
                .recommendedSymbols || []
            )
              .slice(0, 8)
              .map((item) => ({
                symbol: item.symbol,
                name: item.shortname,
                score: item.recommendationScore,
              })),
          }
        : {
            count: 0,
            recommendations: [],
            error: "Failed to fetch recommendations",
          };

    // Process insights
    const insightData =
      insights.status === "fulfilled"
        ? {
            recommendationTrend:
              (
                insights.value as QuoteSummaryResult
              ).recommendationTrend?.trend?.slice(0, 3) || [],
            insiderTransactions:
              (
                insights.value as QuoteSummaryResult
              ).insiderTransactions?.transactions?.slice(0, 5) || [],
            insiderHolders:
              (
                insights.value as QuoteSummaryResult
              ).insiderHolders?.holders?.slice(0, 5) || [],
            upgrades:
              (
                insights.value as QuoteSummaryResult
              ).upgradeDowngradeHistory?.history?.slice(0, 5) || [],
          }
        : { error: "Failed to fetch insights" };

    // Process performance
    const perf =
      history.status === "fulfilled" &&
      (history.value as HistoricalHistoryResult).length > 1
        ? (() => {
            const startPrice = (history.value as HistoricalHistoryResult)[0]
              .open;
            const endPrice = (history.value as HistoricalHistoryResult)[
              (history.value as HistoricalHistoryResult).length - 1
            ].close;
            const totalReturn = ((endPrice - startPrice) / startPrice) * 100;
            const volatility = calculateVolatility(
              history.value as HistoricalHistoryResult
            );

            return {
              period: "1y",
              totalReturn: totalReturn.toFixed(2),
              volatility: volatility.toFixed(4),
              trend: totalReturn > 0 ? "uptrend" : "downtrend",
              currentPrice: quote?.regularMarketPrice,
              priceChange: quote?.regularMarketChange,
              changePercent: quote?.regularMarketChangePercent,
            };
          })()
        : { error: "Failed to fetch performance data" };

    // Process news
    const news =
      includeNews && newsResult?.status === "fulfilled"
        ? {
            count: (newsResult.value as SearchResult).news?.length || 0,
            articles: ((newsResult.value as SearchResult).news || [])
              .slice(0, newsCount)
              .map((article) => ({
                title: article.title,
                publisher: article.publisher,
                publishedAt: article.providerPublishTime,
                link: article.link,
              })),
          }
        : undefined;

    const analysis = {
      symbol,
      recommendations: recs,
      insights: insightData,
      performance: perf,
      news: news,
      timestamp: new Date().toISOString(),
    };

    if (CACHE_ENABLED) {
      await cache.set(cacheKey, analysis, CACHE_TTL_SHORT);
      log("debug", `MCP: Cached stock analysis for ${symbol}`);
    }

    return analysis;
  } catch (error) {
    throw new Error(`Stock analysis tool error: ${error.message}`);
  }
}

/**
 * Handle market intelligence requests - combines trending, screener, and search
 */
async function handleGetMarketIntelligence(
  action: string,
  region = "US",
  screenerType?: string,
  searchQuery?: string,
  count = 25
) {
  try {
    log("debug", `MCP: Fetching market intelligence - action: ${action}`);

    switch (action) {
      case "trending": {
        const cacheKey = `trending:${region}`;
        if (CACHE_ENABLED) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            log("debug", `MCP: Cache hit for trending symbols: ${region}`);
            return cached;
          }
        }

        const trending = (await yahooFinance.trendingSymbols(
          region
        )) as TrendingSymbolsResult;
        const result = {
          type: "trending",
          region,
          count: Math.min(trending.quotes?.length || 0, count),
          symbols: (trending.quotes || []).slice(0, count).map((item) => ({
            symbol: item.symbol,
            name: item.shortname,
            price: item.regularMarketPrice,
            change: item.regularMarketChange,
            changePercent: item.regularMarketChangePercent,
          })),
        };

        if (CACHE_ENABLED) {
          await cache.set(cacheKey, result, CACHE_TTL_SHORT);
        }
        return result;
      }

      case "screener": {
        if (!screenerType) {
          throw new Error("screenerType is required for screener action");
        }

        const cacheKey = `screener:${screenerType}:${count}`;
        if (CACHE_ENABLED) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            log("debug", `MCP: Cache hit for screener: ${screenerType}`);
            return cached;
          }
        }

        const results = await yahooFinance.screener(
          screenerType as PredefinedScreenerModules
        );
        const result = {
          type: "screener",
          screenerType,
          count: Math.min(results.quotes?.length || 0, count),
          stocks: (results.quotes || []).slice(0, count).map((item) => ({
            symbol: item.symbol,
            name: item.shortName,
            price: item.regularMarketPrice,
            change: item.regularMarketChange,
            changePercent: item.regularMarketChangePercent,
            marketCap: item.marketCap,
            volume: item.regularMarketVolume,
          })),
        };

        if (CACHE_ENABLED) {
          await cache.set(cacheKey, result, CACHE_TTL_SHORT);
        }
        return result;
      }

      case "search": {
        if (!searchQuery) {
          throw new Error("searchQuery is required for search action");
        }

        const cacheKey = `search:${searchQuery}`;
        if (CACHE_ENABLED) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            log("debug", `MCP: Cache hit for search: "${searchQuery}"`);
            return cached;
          }
        }

        const results = (await yahooFinance.search(
          searchQuery
        )) as SearchResult;
        const result = {
          type: "search",
          query: searchQuery,
          count: Math.min(results.quotes?.length || 0, count),
          results: (results.quotes || []).slice(0, count).map((item) => ({
            symbol: item.symbol,
            name: item.shortname || item.longname,
            type: item.type,
            exchange: item.exchange,
            score: item.score,
          })),
        };

        if (CACHE_ENABLED) {
          await cache.set(cacheKey, result, CACHE_TTL_SHORT);
        }
        return result;
      }

      default:
        throw new Error(
          `Invalid action: ${action}. Must be 'trending', 'screener', or 'search'`
        );
    }
  } catch (error) {
    throw new Error(`Market intelligence tool error: ${error.message}`);
  }
}

/**
 * Handle financial deep dive requests - combines financial statements and holdings
 */
async function handleGetFinancialDeepDive(symbol: string) {
  try {
    log("debug", `MCP: Fetching financial deep dive for ${symbol}`);

    const cacheKey = `financial_deep_dive:${symbol}`;
    if (CACHE_ENABLED) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        log("debug", `MCP: Cache hit for financial deep dive: ${symbol}`);
        return cached;
      }
    }

    // Fetch financial statements and holdings in parallel
    const [financialsData, holdingsData] = await Promise.allSettled([
      yahooFinance.fundamentalsTimeSeries(symbol, {
        period1: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        period2: new Date().toISOString().split("T")[0],
        type: "annual",
        module: "financials",
      }),
      yahooFinance.quoteSummary(symbol, {
        modules: ["topHoldings", "fundProfile"],
      }),
    ]);

    // Process financial statements
    const financials =
      financialsData.status === "fulfilled"
        ? {
            income: (financialsData.value || [])
              .slice(0, 3)
              .map((item: FundamentalsTimeSeriesResult) => {
                const financialItem =
                  item as FundamentalsTimeSeriesFinancialsResult;
                return {
                  date: financialItem.date,
                  totalRevenue: financialItem.totalRevenue,
                  netIncome: financialItem.netIncome,
                  operatingIncome: financialItem.operatingIncome,
                };
              }),
          }
        : { error: "Failed to fetch financial statements" };

    // Process holdings
    const holdings =
      holdingsData.status === "fulfilled"
        ? {
            topHoldings: (
              (holdingsData.value as QuoteSummaryResult).topHoldings
                ?.holdings || []
            )
              .slice(0, 10)
              .map((h: TopHoldings["holdings"][0]) => ({
                symbol: h.symbol,
                name: h.holdingName,
                percent: h.holdingPercent,
              })),
            fundProfile: {
              family: (holdingsData.value as QuoteSummaryResult).fundProfile
                ?.family,
              category: (holdingsData.value as QuoteSummaryResult).fundProfile
                ?.categoryName,
              expenseRatio: (holdingsData.value as QuoteSummaryResult)
                .fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio,
            },
          }
        : { error: "Failed to fetch holdings" };

    const result = {
      symbol,
      financials,
      holdings,
      timestamp: new Date().toISOString(),
    };

    if (CACHE_ENABLED) {
      await cache.set(cacheKey, result);
    }
    return result;
  } catch (error) {
    throw new Error(`Financial deep dive tool error: ${error.message}`);
  }
}

/**
 * Handle news and research requests - combines news and article reading
 */
async function handleGetNewsAndResearch(
  action: string,
  symbol?: string,
  query?: string,
  url?: string,
  count = 10
) {
  try {
    log("debug", `MCP: Fetching news and research - action: ${action}`);

    switch (action) {
      case "news": {
        if (!symbol) {
          throw new Error("symbol is required for news action");
        }

        const cacheKey = `news:${symbol}:${count}`;
        if (CACHE_ENABLED) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            log("debug", `MCP: Cache hit for news: ${symbol}`);
            return cached;
          }
        }

        const searchResult = (await yahooFinance.search(symbol, {
          newsCount: Math.min(count, 25),
        })) as SearchResult;

        const result = {
          action: "news",
          symbol,
          count: searchResult.news?.length || 0,
          articles: (searchResult.news || [])
            .slice(0, count)
            .map((article) => ({
              title: article.title,
              publisher: article.publisher,
              publishedAt: article.providerPublishTime,
              link: article.link,
            })),
          timestamp: new Date().toISOString(),
        };

        if (CACHE_ENABLED) {
          await cache.set(cacheKey, result, CACHE_TTL_SHORT);
        }
        return result;
      }

      case "read": {
        if (!url) {
          throw new Error("url is required for read action");
        }

        if (!url.startsWith("https://finance.yahoo.com/")) {
          throw new Error(
            "Invalid URL. Must be a full Yahoo Finance URL starting with https://finance.yahoo.com/"
          );
        }

        const cacheKey = `news_reader:${url}`;
        if (CACHE_ENABLED) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            log("debug", `MCP: Cache hit for news reader: ${url}`);
            return cached;
          }
        }

        const response = await fetchArticleContent(url);
        if (response.status !== 200) {
          throw new Error(`Request failed with status code ${response.status}`);
        }

        const { title, content } = extractArticleContent(response.data);
        if (!title || !content) {
          throw new Error("Unable to extract article content");
        }

        const result = {
          action: "read",
          title,
          content,
          url,
          timestamp: new Date().toISOString(),
        };

        if (CACHE_ENABLED) {
          await cache.set(cacheKey, result);
        }
        return result;
      }

      case "search": {
        if (!query) {
          throw new Error("query is required for search action");
        }

        const cacheKey = `search:${query}`;
        if (CACHE_ENABLED) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            log("debug", `MCP: Cache hit for search: "${query}"`);
            return cached;
          }
        }

        const results = (await yahooFinance.search(query)) as SearchResult;
        const result = {
          action: "search",
          query,
          count: Math.min(results.quotes?.length || 0, count),
          results: (results.quotes || []).slice(0, count).map((item) => ({
            symbol: item.symbol,
            name: item.shortname || item.longname,
            type: item.type,
            exchange: item.exchange,
            score: item.score,
          })),
          timestamp: new Date().toISOString(),
        };

        if (CACHE_ENABLED) {
          await cache.set(cacheKey, result, CACHE_TTL_SHORT);
        }
        return result;
      }

      default:
        throw new Error(
          `Invalid action: ${action}. Must be 'news', 'read', or 'search'`
        );
    }
  } catch (error) {
    throw new Error(`News and research tool error: ${error.message}`);
  }
}

/**
 * Calculate volatility from historical data
 */
function calculateVolatility(history) {
  const returns = [];
  for (let i = 1; i < history.length; i++) {
    const ret =
      (history[i].close - history[i - 1].close) / history[i - 1].close;
    returns.push(ret);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map((ret) => Math.pow(ret - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev;
}

// ============================================================================
// Tool Handler Registry
// ============================================================================

/**
 * Map tool names to their handler functions
 */
export const toolHandlers = {
  get_stock_overview: handleGetStockOverview,
  get_stock_analysis: handleGetStockAnalysis,
  get_market_intelligence: handleGetMarketIntelligence,
  get_financial_deep_dive: handleGetFinancialDeepDive,
  get_news_and_research: handleGetNewsAndResearch,
};
