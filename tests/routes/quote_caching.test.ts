/**
 * Quote Route Caching Tests
 * Tests for caching logic in Quote route
 * @module tests/routes/quote_caching.test
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
    quoteSummary: jest.fn() as any,
};

jest.mock("../../src/yahoo.ts", () => ({
    __esModule: true,
    default: mockYahooFinanceInstance,
}));

// Import the router AFTER mocking
import quoteRouter from "../../src/routes/quotes";

const app = express();
app.use(express.json());
app.use("/quote", quoteRouter);

describe("Quote Route Caching", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache.get.mockResolvedValue(undefined);
        mockCache.set.mockResolvedValue(undefined);
    });

    test("should cache quote with short TTL (10s)", async () => {
        const mockQuote = {
            price: { regularMarketPrice: 150.0 },
        };
        mockYahooFinanceInstance.quoteSummary.mockResolvedValue(mockQuote);

        await request(app).get("/quote/AAPL");

        expect(mockCache.set).toHaveBeenCalledWith(
            "quote:AAPL",
            expect.objectContaining({ AAPL: mockQuote }),
            10 // Expecting 10 seconds TTL
        );
    });
});
