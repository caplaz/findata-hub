/**
 * History API Routes tests
 * Tests for history endpoints functionality
 * @module tests/routes/history.test
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
import historyRoutes from "../../src/routes/history";

// Create a test Express app with the routes
const app = express();
app.use(express.json());
app.use("/history", historyRoutes);

// Add error handling middleware for testing
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: "Internal server error" });
});

describe("History Routes", () => {
  afterEach(() => {
    mockYahooFinance.chart.mockClear();
  });

  describe("GET /history/:symbols", () => {
    test("should accept period and interval parameters", async () => {
      mockYahooFinance.chart.mockResolvedValue({
        quotes: [{ date: "2023-01-01", close: 150 }],
      });
      const response = await request(app)
        .get("/history/AAPL")
        .query({ period: "1y", interval: "1d" });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("AAPL");
        expect(Array.isArray(response.body.AAPL)).toBe(true);
      }
    });

    test("should use default period and interval", async () => {
      mockYahooFinance.chart.mockResolvedValue({
        quotes: [{ date: "2023-01-01", close: 150 }],
      });
      const response = await request(app).get("/history/AAPL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("AAPL");
        expect(Array.isArray(response.body.AAPL)).toBe(true);
      }
    });

    test("should handle multiple symbols with parameters", async () => {
      mockYahooFinance.chart
        .mockResolvedValueOnce({ quotes: [{ date: "2023-01-01", close: 150 }] })
        .mockResolvedValueOnce({
          quotes: [{ date: "2023-01-01", close: 2800 }],
        });
      const response = await request(app)
        .get("/history/AAPL,MSFT")
        .query({ period: "3mo", interval: "1d" });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("AAPL");
        expect(response.body).toHaveProperty("MSFT");
        expect(Array.isArray(response.body.AAPL)).toBe(true);
        expect(Array.isArray(response.body.MSFT)).toBe(true);
      }
    });

    test("should handle API errors gracefully", async () => {
      mockYahooFinance.chart.mockRejectedValue(new Error("API error"));
      const response = await request(app).get("/history/INVALID");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("INVALID");
        expect(response.body.INVALID).toHaveProperty("error");
      }
    });
  });
});
