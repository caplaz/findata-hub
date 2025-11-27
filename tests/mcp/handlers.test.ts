/**
 * MCP Handlers Tests
 * Tests for MCP tool handler functions
 * @module tests/mcp/handlers.test
 */

import { jest } from "@jest/globals";

// Mock yahoo-finance2
const mockYahooFinanceInstance = {
  quote: jest.fn() as any,
  historical: jest.fn() as any,
  quoteSummary: jest.fn() as any,
  search: jest.fn() as any,
  trendingSymbols: jest.fn() as any,
  recommendationsBySymbol: jest.fn() as any,
  screener: jest.fn() as any,
  screeners: jest.fn() as any,
  fundamentalsTimeSeries: jest.fn() as any,
};

jest.mock("yahoo-finance2", () => ({
  __esModule: true,
  default: jest.fn(() => mockYahooFinanceInstance),
}));

const mockNewsScraper = {
  fetchArticleContent: jest.fn() as any,
  extractArticleContent: jest.fn() as any,
};

jest.mock("../../src/utils/newsScraper.ts", () => ({
  fetchArticleContent: mockNewsScraper.fetchArticleContent,
  extractArticleContent: mockNewsScraper.extractArticleContent,
}));

const mockCache = {
  get: jest.fn() as any,
  set: jest.fn() as any,
};

jest.mock("../../src/config/cache.ts", () => ({
  cache: mockCache,
  CACHE_ENABLED: true,
}));

import { toolHandlers } from "../../src/mcp/handlers";
const yahooFinance = mockYahooFinanceInstance;
const newsScraper = mockNewsScraper;
const cache = mockCache;

describe("MCP Tool Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cache mocks to return undefined (cache miss)
    mockCache.get.mockResolvedValue(undefined);
    mockCache.set.mockResolvedValue(undefined);
  });

  describe("get_stock_overview handler", () => {
    test("should fetch comprehensive stock overview", async () => {
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
          website: "https://www.apple.com",
        },
        summaryDetail: {
          beta: 1.2,
          forwardPE: 25.5,
          bookValue: 4.5,
          priceToBook: 33.3,
        },
      };

      yahooFinance.quote.mockResolvedValue(mockQuote);
      yahooFinance.quoteSummary.mockResolvedValue(mockSummary);

      const result = await toolHandlers.get_stock_overview("AAPL");

      expect(yahooFinance.quote).toHaveBeenCalledWith("AAPL");
      expect(yahooFinance.quoteSummary).toHaveBeenCalledWith("AAPL", {
        modules: [
          "assetProfile",
          "recommendationTrend",
          "financialData",
          "summaryDetail",
        ],
      });
      expect((result as any).symbol).toBe("AAPL");
      expect((result as any).currentPrice).toBe(150.0);
      expect((result as any).companyName).toBe("Apple Inc.");
      expect((result as any).industry).toBe("Consumer Electronics");
      expect((result as any).beta).toBe(1.2);
      expect((result as any).forwardPE).toBe(25.5);
    });
  });

  describe("get_stock_analysis handler", () => {
    test("should fetch comprehensive stock analysis", async () => {
      const mockQuote = {
        symbol: "AAPL",
        regularMarketPrice: 150.0,
      };
      const mockRecommendations = {
        recommendedSymbols: [
          {
            symbol: "AAPL",
            recommendationKey: "buy",
            recommendationScore: 2.0,
          },
        ],
      };
      const mockInsights = {
        recommendationTrend: {
          trend: [{ period: "0m", buy: 10, hold: 5, sell: 2 }],
        },
        insiderTransactions: { transactions: [] },
        insiderHolders: { holders: [] },
        upgradeDowngradeHistory: { history: [] },
      };
      const mockHistory = [
        { date: new Date("2023-01-01"), close: 100 },
        { date: new Date("2023-12-31"), close: 150 },
      ];
      const mockNews = {
        news: [
          {
            title: "Apple News",
            publisher: "Reuters",
            link: "http://news.com",
            providerPublishTime: 1234567890,
          },
        ],
      };

      yahooFinance.quote.mockResolvedValue(mockQuote);
      yahooFinance.recommendationsBySymbol.mockResolvedValue(
        mockRecommendations
      );
      yahooFinance.quoteSummary.mockResolvedValue(mockInsights);
      yahooFinance.historical.mockResolvedValue(mockHistory);
      yahooFinance.search.mockResolvedValue(mockNews);

      const result = await toolHandlers.get_stock_analysis("AAPL");

      expect((result as any).symbol).toBe("AAPL");
      expect((result as any).recommendations).toBeDefined();
      expect((result as any).insights).toBeDefined();
      expect((result as any).performance).toBeDefined();
      expect((result as any).news).toBeDefined();
      expect((result as any).news.count).toBe(1);
      expect((result as any).news.articles[0].title).toBe("Apple News");
    });

    test("should handle analysis without news", async () => {
      const mockQuote = {
        symbol: "AAPL",
        regularMarketPrice: 150.0,
      };
      const mockRecommendations = {
        recommendedSymbols: [],
      };
      const mockInsights = {
        recommendationTrend: { trend: [] },
        insiderTransactions: { transactions: [] },
        insiderHolders: { holders: [] },
        upgradeDowngradeHistory: { history: [] },
      };
      const mockHistory = [
        { date: new Date("2023-01-01"), close: 100 },
        { date: new Date("2023-12-31"), close: 150 },
      ];

      yahooFinance.quote.mockResolvedValue(mockQuote);
      yahooFinance.recommendationsBySymbol.mockResolvedValue(
        mockRecommendations
      );
      yahooFinance.quoteSummary.mockResolvedValue(mockInsights);
      yahooFinance.historical.mockResolvedValue(mockHistory);

      const result = await toolHandlers.get_stock_analysis("AAPL", false);

      expect((result as any).symbol).toBe("AAPL");
      expect((result as any).news).toBeUndefined();
    });
  });

  describe("get_market_intelligence handler", () => {
    test("should fetch trending symbols", async () => {
      const mockTrending = {
        quotes: [
          {
            symbol: "NVDA",
            shortname: "NVIDIA Corp",
            regularMarketPrice: 400,
          },
        ],
      };

      yahooFinance.trendingSymbols.mockResolvedValue(mockTrending);

      const result = await toolHandlers.get_market_intelligence("trending");

      expect(yahooFinance.trendingSymbols).toHaveBeenCalledWith("US");
      expect((result as any).type).toBe("trending");
      expect((result as any).region).toBe("US");
      expect((result as any).count).toBe(1);
      expect((result as any).symbols).toHaveLength(1);
      expect((result as any).symbols[0].symbol).toBe("NVDA");
    });

    test("should fetch screener results", async () => {
      const mockScreener = {
        quotes: [
          {
            symbol: "AMD",
            shortname: "AMD",
            regularMarketPrice: 100,
          },
        ],
      };

      yahooFinance.screener.mockResolvedValue(mockScreener);

      const result = await toolHandlers.get_market_intelligence(
        "screener",
        "US",
        "day_gainers"
      );

      expect(yahooFinance.screener).toHaveBeenCalledWith("day_gainers");
      expect((result as any).type).toBe("screener");
      expect((result as any).screenerType).toBe("day_gainers");
      expect((result as any).count).toBe(1);
      expect((result as any).stocks).toHaveLength(1);
    });

    test("should search for symbols", async () => {
      const mockSearch = {
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            type: "EQUITY",
          },
        ],
      };

      yahooFinance.search.mockResolvedValue(mockSearch);

      const result = await toolHandlers.get_market_intelligence(
        "search",
        "US",
        undefined,
        "apple"
      );

      expect(yahooFinance.search).toHaveBeenCalledWith("apple");
      expect((result as any).type).toBe("search");
      expect((result as any).query).toBe("apple");
      expect((result as any).count).toBe(1);
      expect((result as any).results).toHaveLength(1);
    });
  });

  describe("get_financial_deep_dive handler", () => {
    test("should fetch comprehensive financial data", async () => {
      const mockFinancials = [
        {
          date: new Date("2023-12-31"),
          totalRevenue: 1000000,
          netIncome: 200000,
        },
      ];
      const mockHoldings = {
        topHoldings: {
          holdings: [
            { symbol: "AAPL", holdingName: "Apple Inc", holdingPercent: 0.05 },
          ],
        },
        fundProfile: {
          family: "SPDR",
          categoryName: "Large Blend",
          legalType: "ETF",
        },
      };

      yahooFinance.fundamentalsTimeSeries.mockResolvedValue(mockFinancials);
      yahooFinance.quoteSummary.mockResolvedValue(mockHoldings);

      const result = await toolHandlers.get_financial_deep_dive("SPY");

      expect((result as any).symbol).toBe("SPY");
      expect((result as any).financials).toBeDefined();
      expect((result as any).holdings).toBeDefined();
      expect((result as any).financials.income).toHaveLength(1);
      expect((result as any).holdings.fundProfile.family).toBe("SPDR");
      expect((result as any).holdings.topHoldings).toHaveLength(1);
    });
  });

  describe("get_news_and_research handler", () => {
    test("should fetch stock news", async () => {
      const mockNews = {
        news: [
          {
            title: "Apple News",
            publisher: "Reuters",
            link: "http://news.com",
            providerPublishTime: 1234567890,
          },
        ],
      };

      yahooFinance.search.mockResolvedValue(mockNews);

      const result = await toolHandlers.get_news_and_research("news", "AAPL");

      expect((result as any).action).toBe("news");
      expect((result as any).symbol).toBe("AAPL");
      expect((result as any).count).toBe(1);
      expect((result as any).articles).toHaveLength(1);
      expect((result as any).articles[0].title).toBe("Apple News");
    });

    test("should read news article", async () => {
      const mockUrl = "https://finance.yahoo.com/news/test-article.html";
      newsScraper.fetchArticleContent.mockResolvedValue({
        status: 200,
        data: "<html><body><h1>Title</h1><p>Content</p></body></html>",
      });
      newsScraper.extractArticleContent.mockReturnValue({
        title: "Test Title",
        content: "Test Content",
      });

      const result = await toolHandlers.get_news_and_research(
        "read",
        undefined,
        undefined,
        mockUrl
      );

      expect((result as any).action).toBe("read");
      expect((result as any).title).toBe("Test Title");
      expect((result as any).content).toBe("Test Content");
      expect((result as any).url).toBe(mockUrl);
    });

    test("should search for symbols", async () => {
      const mockSearch = {
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            type: "EQUITY",
          },
        ],
      };

      yahooFinance.search.mockResolvedValue(mockSearch);

      const result = await toolHandlers.get_news_and_research(
        "search",
        undefined,
        "apple"
      );

      expect((result as any).action).toBe("search");
      expect((result as any).query).toBe("apple");
      expect((result as any).count).toBe(1);
      expect((result as any).results).toHaveLength(1);
    });
  });
});
