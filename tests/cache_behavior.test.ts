/**
 * Cache Behavior Tests
 * Tests for caching logic in MCP handlers
 * @module tests/cache_behavior.test
 */

import { jest } from "@jest/globals";

// Mock yahoo-finance2
const mockYahooFinanceInstance = {
  quote: jest.fn() as any,
  historical: jest.fn() as any,
  quoteSummary: jest.fn() as any,
  recommendationsBySymbol: jest.fn() as any,
};

jest.mock("yahoo-finance2", () => ({
  __esModule: true,
  default: jest.fn(() => mockYahooFinanceInstance),
}));

// Mock cache
const mockCache = {
  get: jest.fn() as any,
  set: jest.fn() as any,
};

jest.mock("../src/config/cache.ts", () => ({
  cache: mockCache,
  CACHE_ENABLED: true,
  CACHE_TTL_SHORT: 10,
}));

// Mock news scraper (needed because handlers imports it)
jest.mock("../src/utils/newsScraper.ts", () => ({
  fetchArticleContent: jest.fn(),
  extractArticleContent: jest.fn(),
}));

import { toolHandlers } from "../src/mcp/handlers";
const yahooFinance = mockYahooFinanceInstance;
const cache = mockCache;

describe("Cache Behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default cache miss
    mockCache.get.mockResolvedValue(undefined);
    mockCache.set.mockResolvedValue(undefined);
  });

  describe("get_stock_overview caching", () => {
    test("should cache overview with short TTL (10s)", async () => {
      const mockQuote = {
        symbol: "AAPL",
        regularMarketPrice: 150.0,
        currency: "USD",
        regularMarketChange: 2.5,
        regularMarketChangePercent: 1.6,
        marketCap: 2500000000000,
      };
      const mockSummary = {
        assetProfile: {
          longName: "Apple Inc.",
          industry: "Consumer Electronics",
          sector: "Technology",
        },
        summaryDetail: {
          dividendYield: 0.005,
          peRatio: 25.0,
        },
      };
      yahooFinance.quote.mockResolvedValue(mockQuote);
      yahooFinance.quoteSummary.mockResolvedValue(mockSummary);

      await toolHandlers.get_stock_overview("AAPL");

      expect(cache.set).toHaveBeenCalledWith(
        "overview:AAPL",
        expect.any(Object),
        10 // Expecting 10 seconds TTL
      );
    });
  });

  describe("get_stock_analysis caching", () => {
    test("should check cache for analysis data", async () => {
      // Setup: AAPL analysis is in cache
      const mockCachedAnalysis = {
        symbol: "AAPL",
        recommendations: { count: 1, recommendations: [] },
        performance: { totalReturn: "10.00" },
        insights: {},
        news: undefined,
        timestamp: new Date().toISOString(),
      };

      mockCache.get.mockImplementation(async (key: string) => {
        if (key.includes("analysis:AAPL")) return mockCachedAnalysis;
        return undefined;
      });

      const result = (await toolHandlers.get_stock_analysis(
        "AAPL",
        false
      )) as any;

      // Should have called cache.get for analysis
      expect(cache.get).toHaveBeenCalledWith(
        expect.stringContaining("analysis:AAPL")
      );

      // Should return cached result
      expect(result.symbol).toBe("AAPL");
      expect(result.recommendations).toBeDefined();
    });

    test("should cache newly fetched analysis", async () => {
      const mockQuote = {
        symbol: "AAPL",
        regularMarketPrice: 150.0,
        regularMarketChange: 2.5,
        regularMarketChangePercent: 1.6,
      };
      const mockHistory = [
        {
          date: new Date(),
          open: 140,
          close: 150,
          high: 155,
          low: 145,
          volume: 1000000,
        },
      ];
      const mockRecommendations = {
        recommendedSymbols: [
          { symbol: "AAPL", shortname: "Apple", recommendationScore: 2.0 },
        ],
      };
      const mockInsights = {
        recommendationTrend: { trend: [] },
        insiderTransactions: { transactions: [] },
        insiderHolders: { holders: [] },
        upgradeDowngradeHistory: { history: [] },
      };

      yahooFinance.quote.mockResolvedValue(mockQuote);
      yahooFinance.historical.mockResolvedValue(mockHistory);
      yahooFinance.recommendationsBySymbol.mockResolvedValue(
        mockRecommendations
      );
      yahooFinance.quoteSummary.mockResolvedValue(mockInsights);

      await toolHandlers.get_stock_analysis("GOOGL", false);

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining("analysis:GOOGL"),
        expect.objectContaining({ symbol: "GOOGL" }),
        expect.any(Number)
      );
    });
  });
});
