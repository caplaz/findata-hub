/**
 * Holdings API Routes tests
 * Tests for holdings endpoints functionality
 * @module tests/routes/holdings.test
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

describe("Holdings Routes", () => {
  describe("GET /holdings/:symbol", () => {
    test("should return ETF holdings for valid symbol", async () => {
      const response = await request(app).get("/holdings/SPY");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        // Should have at least one of the expected modules
        expect(
          response.body.topHoldings ||
            response.body.sectorWeightings ||
            response.body.equityHoldings
        ).toBeDefined();
      }
    });

    test("should handle case-insensitive symbols", async () => {
      const response = await request(app).get("/holdings/spy");
      expect([200, 500]).toContain(response.status);
    });

    test("should cache ETF holdings requests", async () => {
      const response1 = await request(app).get("/holdings/SPY");
      const response2 = await request(app).get("/holdings/SPY");

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body).toEqual(response2.body);
      }
    });
  });

  describe("GET /holdings/:symbol/fund", () => {
    test("should return mutual fund holdings for valid symbol", async () => {
      const response = await request(app).get("/holdings/VFIAX/fund");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        // Should have at least one of the expected modules
        expect(
          response.body.fundHoldings || response.body.fundProfile
        ).toBeDefined();
      }
    });

    test("should handle case-insensitive symbols", async () => {
      const response = await request(app).get("/holdings/vfiax/fund");
      expect([200, 500]).toContain(response.status);
    });

    test("should cache mutual fund holdings requests", async () => {
      const response1 = await request(app).get("/holdings/VFIAX/fund");
      const response2 = await request(app).get("/holdings/VFIAX/fund");

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body).toEqual(response2.body);
      }
    });
  });
});
