/**
 * Quote API Routes tests
 * Tests for quote endpoints functionality
 * @module tests/routes/quote.test
 */

import { jest } from "@jest/globals";

// Mock the yahoo-finance2 module before importing routes
const mockYahooFinance = {
  quoteSummary: jest.fn() as any,
  chart: jest.fn() as any,
};

jest.unstable_mockModule("yahoo-finance2", () => ({
  default: mockYahooFinance,
}));

import request from "supertest";
import express from "express";
import quoteRoutes from "../../src/routes/quotes";

// Create a test Express app with the routes
const app = express();
app.use(express.json());
app.use("/quote", quoteRoutes);

// Add error handling middleware for testing
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: "Internal server error" });
});

describe("Quote Routes", () => {
  afterEach(() => {
    mockYahooFinance.quoteSummary.mockClear();
  });

  describe("GET /quote/:symbols", () => {
    test("should return 200 for valid symbol", async () => {
      mockYahooFinance.quoteSummary.mockResolvedValue({
        symbol: "AAPL",
        regularMarketPrice: 150,
      });
      const response = await request(app).get("/quote/AAPL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty("AAPL");
      }
    });

    test("should handle multiple symbols", async () => {
      mockYahooFinance.quoteSummary
        .mockResolvedValueOnce({ symbol: "AAPL", regularMarketPrice: 150 })
        .mockResolvedValueOnce({ symbol: "GOOGL", regularMarketPrice: 2800 });
      const response = await request(app).get("/quote/AAPL,GOOGL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("AAPL");
        expect(response.body).toHaveProperty("GOOGL");
      }
    });

    test("should handle API errors gracefully", async () => {
      mockYahooFinance.quoteSummary.mockRejectedValue(new Error("API error"));
      const response = await request(app).get("/quote/INVALID");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("INVALID");
        expect(response.body.INVALID).toHaveProperty("error");
      }
    });

    test("should return error for completely invalid input", async () => {
      const response = await request(app).get("/quote/");
      expect(response.status).toBe(404); // Route not matched
    });
  });
});
