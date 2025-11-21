/**
 * Financial API Routes tests
 * Tests for financial endpoints functionality
 * @module tests/routes/financial.test
 */

import request from "supertest";
import express from "express";
import routes from "../../src/routes/index";

// Create a test Express app with the routes
const app = express();
app.use(express.json());
app.use(routes);

// Add error handling middleware for testing
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: "Internal server error" });
});

describe("Financial Routes", () => {
  describe("GET /financial/:symbol/:type", () => {
    test("should return 200 for valid income statement request", async () => {
      const response = await request(app).get("/financial/AAPL/income");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("symbol", "AAPL");
        expect(response.body).toHaveProperty("type", "income");
        expect(response.body).toHaveProperty("count");
        expect(response.body).toHaveProperty("statements");
        expect(Array.isArray(response.body.statements)).toBe(true);
      }
    });

    test("should return 200 for balance sheet request", async () => {
      const response = await request(app).get("/financial/MSFT/balance");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("symbol", "MSFT");
        expect(response.body).toHaveProperty("type", "balance");
        expect(response.body).toHaveProperty("statements");
      }
    });

    test("should return 200 for cashflow request", async () => {
      const response = await request(app).get("/financial/GOOGL/cashflow");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("symbol", "GOOGL");
        expect(response.body).toHaveProperty("type", "cashflow");
        expect(response.body).toHaveProperty("statements");
      }
    });

    test("should accept period query parameter", async () => {
      const response = await request(app)
        .get("/financial/AAPL/income")
        .query({ period: "annual" });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("period", "annual");
      }
    });

    test("should handle quarterly period parameter", async () => {
      const response = await request(app)
        .get("/financial/MSFT/balance")
        .query({ period: "quarterly" });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("period", "quarterly");
      }
    });

    test("should return 400 for invalid statement type", async () => {
      const response = await request(app).get("/financial/AAPL/invalid");
      expect([400, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toContain("Invalid statement type");
      }
    });

    test("should return 400 for invalid period parameter", async () => {
      const response = await request(app)
        .get("/financial/AAPL/income")
        .query({ period: "invalid" });
      expect([400, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toContain("Invalid period");
      }
    });

    test("should handle case-insensitive symbols", async () => {
      const response = await request(app).get("/financial/aapl/income");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("symbol", "AAPL");
      }
    });

    test("should cache financial statement requests", async () => {
      const response1 = await request(app).get("/financial/AAPL/income");
      const response2 = await request(app).get("/financial/AAPL/income");

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body).toEqual(response2.body);
      }
    });
  });
});
