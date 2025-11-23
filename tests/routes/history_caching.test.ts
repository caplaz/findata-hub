/**
 * History Route Caching Tests
 * Tests for caching logic in History route
 * @module tests/routes/history_caching.test
 */

import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// Mock cache
const mockCache = {
    get: jest.fn() as any,
    set: jest.fn() as any,
};

jest.mock("../../src/config/cache.ts", () => ({
    cache: mockCache,
    CACHE_ENABLED: true,
    CACHE_TTL_SHORT: 10,
}));

// Mock yahoo-finance2
const mockYahooFinanceInstance = {
    chart: jest.fn() as any,
};

jest.mock("../../src/yahoo.ts", () => ({
    __esModule: true,
    default: mockYahooFinanceInstance,
}));

// Import the router AFTER mocking
import historyRouter from "../../src/routes/history";

const app = express();
app.use(express.json());
app.use("/history", historyRouter);

describe("History Route Caching", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache.get.mockResolvedValue(undefined);
        mockCache.set.mockResolvedValue(undefined);
    });

    test("should check cache for each symbol individually", async () => {
        // Setup: AAPL is in cache, MSFT is not
        const mockCachedAAPL = [
            { date: "2023-01-01", close: 150 }
        ];

        mockCache.get.mockImplementation(async (key: string) => {
            if (key.includes("AAPL")) return mockCachedAAPL;
            return undefined;
        });

        const mockHistoryMSFT = {
            quotes: [{ date: "2023-01-01", close: 300 }]
        };
        mockYahooFinanceInstance.chart.mockResolvedValue(mockHistoryMSFT);

        const response = await request(app).get("/history/AAPL,MSFT");

        // Should have called cache.get for both
        expect(mockCache.get).toHaveBeenCalledWith(expect.stringContaining("AAPL"));
        expect(mockCache.get).toHaveBeenCalledWith(expect.stringContaining("MSFT"));

        // Should only fetch MSFT from API
        expect(mockYahooFinanceInstance.chart).toHaveBeenCalledTimes(1);
        expect(mockYahooFinanceInstance.chart).toHaveBeenCalledWith(
            "MSFT",
            expect.any(Object)
        );

        // Response should contain both
        expect(response.body).toHaveProperty("AAPL");
        expect(response.body).toHaveProperty("MSFT");
        expect(response.body.AAPL).toEqual(mockCachedAAPL);
        expect(response.body.MSFT).toEqual(mockHistoryMSFT.quotes);
    });

    test("should cache newly fetched symbols individually", async () => {
        const mockHistory = {
            quotes: [{ date: "2023-01-01", close: 100 }]
        };
        mockYahooFinanceInstance.chart.mockResolvedValue(mockHistory);

        await request(app).get("/history/GOOGL");

        expect(mockCache.set).toHaveBeenCalledWith(
            expect.stringContaining("history:GOOGL"),
            mockHistory.quotes
        );
    });
});
