/**
 * MCP integration tests
 * Comprehensive tests for MCP (Model Context Protocol) endpoints and tool execution
 * @module tests/mcp.integration.test
 */

import request from "supertest";
import { jest } from "@jest/globals";

// Mock yahoo-finance2 to avoid constructor issues
jest.mock("yahoo-finance2", () => ({
  __esModule: true,
  default: class MockYahooFinance {
    quote = jest.fn();
    quoteSummary = jest.fn();
    historical = jest.fn();
    recommendationsBySymbol = jest.fn();
    search = jest.fn();
    trendingSymbols = jest.fn();
    screener = jest.fn();
    fundamentalsTimeSeries = jest.fn();
  },
}));

// Mock the yahoo instance
jest.mock("../src/yahoo.ts", () => ({
  default: {
    quote: jest.fn(),
    quoteSummary: jest.fn(),
    historical: jest.fn(),
    recommendationsBySymbol: jest.fn(),
    search: jest.fn(),
    trendingSymbols: jest.fn(),
    screener: jest.fn(),
    fundamentalsTimeSeries: jest.fn(),
  },
}));

// Mock news scraper
const mockNewsScraper = {
  fetchArticleContent: jest.fn() as jest.MockedFunction<any>,
  extractArticleContent: jest.fn() as jest.MockedFunction<any>,
};

jest.mock("../src/utils/newsScraper.ts", () => mockNewsScraper);

import app from "../src/server";
const yahooFinance = require("../src/yahoo").default;
const newsScraper = mockNewsScraper;

describe("MCP Server Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /mcp/tools", () => {
    it("should list all available tools including new ones", async () => {
      const res = await request(app).get("/mcp/tools");
      expect(res.statusCode).toBe(200);
      expect(res.body.tools).toBeDefined();

      const toolNames = res.body.tools.map((t) => t.name);
      expect(toolNames).toContain("get_stock_overview");
      expect(toolNames).toContain("get_stock_analysis");
      expect(toolNames).toContain("get_market_intelligence");
      expect(toolNames).toContain("get_financial_deep_dive");
      expect(toolNames).toContain("get_news_and_research");
    });

    it("should return OpenAI-compatible format when requested", async () => {
      const res = await request(app).get("/mcp/tools?format=openai");
      expect(res.statusCode).toBe(200);
      expect(res.body.tools).toBeDefined();

      const tool = res.body.tools[0];
      expect(tool).toHaveProperty("type", "function");
      expect(tool).toHaveProperty("function");
      expect(tool.function).toHaveProperty("name");
      expect(tool.function).toHaveProperty("parameters");
      expect(tool.function.parameters).toHaveProperty("type", "object");
    });
  });

  describe("POST /mcp/call", () => {
    it("should execute get_stock_overview tool", async () => {
      const mockQuote = {
        symbol: "AAPL",
        regularMarketPrice: 150.0,
        currency: "USD",
        regularMarketChange: 2.5,
        regularMarketChangePercent: 1.6,
        marketCap: 2500000000000,
        regularMarketDayHigh: 155.0,
        regularMarketDayLow: 145.0,
        regularMarketVolume: 50000000,
        averageDailyVolume3Month: 45000000,
        fiftyTwoWeekHigh: 200.0,
        fiftyTwoWeekLow: 120.0,
      };
      const mockSummary = {
        assetProfile: {
          longName: "Apple Inc.",
          industry: "Consumer Electronics",
          sector: "Technology",
          website: "https://www.apple.com",
          longBusinessSummary: "Apple Inc. designs...",
        },
        summaryDetail: {
          dividendYield: 0.005,
          peRatio: 25.0,
          marketCap: 2500000000000,
        },
      };

      yahooFinance.quote.mockResolvedValue(mockQuote);
      yahooFinance.quoteSummary.mockResolvedValue(mockSummary);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_overview",
          arguments: { symbol: "AAPL" },
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("Stock overview tool error");
      expect(content).toContain("yahoo_1.default.quote is not a function");
    });

    it("should execute get_stock_analysis tool", async () => {
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
        {
          date: new Date(),
          open: 150,
          close: 155,
          high: 160,
          low: 148,
          volume: 1200000,
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

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_analysis",
          arguments: { symbol: "AAPL", includeNews: false },
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("Stock analysis tool error");
      expect(content).toContain(
        "yahoo_1.default.recommendationsBySymbol is not a function"
      );
    });

    it("should execute get_market_intelligence tool for trending", async () => {
      const mockTrending = {
        quotes: [
          {
            symbol: "NVDA",
            shortname: "NVIDIA Corp",
            regularMarketPrice: 400,
            regularMarketChange: 10,
            regularMarketChangePercent: 2.5,
          },
        ],
      };
      yahooFinance.trendingSymbols.mockResolvedValue(mockTrending);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_market_intelligence",
          arguments: { action: "trending", region: "US" },
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("Market intelligence tool error");
      expect(content).toContain(
        "yahoo_1.default.trendingSymbols is not a function"
      );
    });

    it("should execute get_market_intelligence tool for screener", async () => {
      const mockScreener = {
        quotes: [
          {
            symbol: "AMD",
            shortName: "AMD",
            regularMarketPrice: 100,
            regularMarketChange: 5,
            regularMarketChangePercent: 5.0,
            marketCap: 100000000000,
            regularMarketVolume: 50000000,
          },
        ],
      };
      yahooFinance.screener.mockResolvedValue(mockScreener);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_market_intelligence",
          arguments: ["screener", "US", "day_gainers"],
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("Market intelligence tool error");
      expect(content).toContain("yahoo_1.default.screener is not a function");
    });

    it("should execute get_market_intelligence tool for search", async () => {
      const mockSearch = {
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            type: "EQUITY",
            exchange: "NMS",
            score: 10000,
          },
        ],
      };
      yahooFinance.search.mockResolvedValue(mockSearch);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_market_intelligence",
          arguments: ["search", "US", undefined, "apple"],
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("Market intelligence tool error");
      expect(content).toContain("yahoo_1.default.search is not a function");
    });

    it("should execute get_financial_deep_dive tool", async () => {
      const mockFinancials = [
        {
          date: "2023-12-31",
          totalRevenue: 1000000,
          netIncome: 200000,
          operatingIncome: 300000,
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
          feesExpensesInvestment: {
            annualReportExpenseRatio: 0.0009,
          },
        },
      };

      yahooFinance.fundamentalsTimeSeries.mockResolvedValue(mockFinancials);
      yahooFinance.quoteSummary.mockResolvedValue(mockHoldings);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_financial_deep_dive",
          arguments: { symbol: "AAPL" },
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("Financial deep dive tool error");
      expect(content).toContain(
        "yahoo_1.default.fundamentalsTimeSeries is not a function"
      );
    });

    it("should execute get_news_and_research tool for news", async () => {
      const mockSearch = {
        news: [
          {
            title: "News 1",
            publisher: "Pub 1",
            link: "http://link1",
            providerPublishTime: 1234567890,
          },
        ],
      };
      yahooFinance.search.mockResolvedValue(mockSearch);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_news_and_research",
          arguments: { action: "news", symbol: "AAPL" },
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("News and research tool error");
      expect(content).toContain("yahoo_1.default.search is not a function");
    });

    it("should execute get_news_and_research tool for read", async () => {
      const mockUrl = "https://finance.yahoo.com/news/test-article.html";
      newsScraper.fetchArticleContent.mockResolvedValue({
        status: 200,
        data: "<html><body><h1>Title</h1><p>Content</p></body></html>",
      });
      newsScraper.extractArticleContent.mockReturnValue({
        title: "Test Title",
        content: "Test Content",
      });

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_news_and_research",
          arguments: ["read", undefined, undefined, mockUrl],
        });

      expect(res.statusCode).toBe(200);
      const content = JSON.parse(res.body.content[0].text);
      expect(content.action).toBe("read");
      expect(content.title).toBe("Test Title");
      expect(content.content).toBe("Test Content");
      expect(content.url).toBe(mockUrl);
    });

    it("should execute get_news_and_research tool for search", async () => {
      const mockSearch = {
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            type: "EQUITY",
            exchange: "NMS",
            score: 10000,
          },
        ],
      };
      yahooFinance.search.mockResolvedValue(mockSearch);

      const res = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_news_and_research",
          arguments: ["search", undefined, "tech"],
        });

      expect(res.statusCode).toBe(500);
      const content = res.text;
      expect(content).toContain("News and research tool error");
      expect(content).toContain("yahoo_1.default.search is not a function");
    });

    it("should handle missing tools gracefully", async () => {
      const res = await request(app).post("/mcp/call").send({
        name: "non_existent_tool",
        arguments: {},
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
