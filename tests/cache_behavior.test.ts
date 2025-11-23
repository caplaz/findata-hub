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

    describe("get_stock_quote caching", () => {
        test("should cache quote with short TTL (10s)", async () => {
            const mockQuote = {
                symbol: "AAPL",
                regularMarketPrice: 150.0,
                currency: "USD",
                regularMarketChange: 2.5,
                regularMarketChangePercent: 1.6,
                marketCap: 2500000000000,
            };
            yahooFinance.quote.mockResolvedValue(mockQuote);

            await toolHandlers.get_stock_quote("AAPL");

            expect(cache.set).toHaveBeenCalledWith(
                "quote:AAPL",
                expect.any(Array),
                10 // Expecting 10 seconds TTL
            );
        });
    });

    describe("get_stock_history caching", () => {
        test("should check cache for each symbol individually", async () => {
            // Setup: AAPL is in cache, MSFT is not
            const mockCachedAAPL = {
                symbol: "AAPL",
                dataPoints: 100,
                data: [],
            };

            mockCache.get.mockImplementation(async (key: string) => {
                if (key.includes("AAPL")) return mockCachedAAPL;
                return undefined;
            });

            const mockHistoryMSFT = [
                {
                    date: new Date(),
                    open: 300,
                    high: 310,
                    low: 290,
                    close: 305,
                    volume: 5000000,
                },
            ];
            yahooFinance.historical.mockResolvedValue(mockHistoryMSFT);

            const result = await toolHandlers.get_stock_history("AAPL,MSFT");

            // Should have called cache.get for both
            expect(cache.get).toHaveBeenCalledWith(expect.stringContaining("AAPL"));
            expect(cache.get).toHaveBeenCalledWith(expect.stringContaining("MSFT"));

            // Should only fetch MSFT from API
            expect(yahooFinance.historical).toHaveBeenCalledTimes(1);
            expect(yahooFinance.historical).toHaveBeenCalledWith(
                "MSFT",
                expect.any(Object)
            );
            expect(yahooFinance.historical).not.toHaveBeenCalledWith(
                "AAPL",
                expect.any(Object)
            );

            // Result should contain both
            expect(result).toHaveLength(2);
            const aaplResult = result.find((r: any) => r.symbol === "AAPL");
            const msftResult = result.find((r: any) => r.symbol === "MSFT");

            expect(aaplResult).toBeDefined();
            expect(msftResult).toBeDefined();
        });

        test("should cache newly fetched symbols individually", async () => {
            const mockHistory = [
                {
                    date: new Date(),
                    open: 100,
                    high: 110,
                    low: 90,
                    close: 105,
                    volume: 1000000,
                },
            ];
            yahooFinance.historical.mockResolvedValue(mockHistory);

            await toolHandlers.get_stock_history("GOOGL");

            expect(cache.set).toHaveBeenCalledWith(
                expect.stringContaining("history:GOOGL"),
                expect.objectContaining({ symbol: "GOOGL" })
            );
        });
    });
});
