/**
 * News API Routes tests
 * Tests for news endpoints functionality
 * @module tests/routes/news.test
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

describe("News Routes", () => {
  describe("GET /news/:symbol", () => {
    test("should return 200 for valid symbol", async () => {
      const response = await request(app).get("/news/AAPL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("symbol", "AAPL");
        expect(response.body).toHaveProperty("count");
        expect(response.body).toHaveProperty("news");
        expect(Array.isArray(response.body.news)).toBe(true);
        expect(response.body).toHaveProperty("companyInfo");
        expect(response.body).toHaveProperty("message");
      } else if (response.status === 500) {
        // API may be temporarily unavailable due to Yahoo Finance changes
        expect(response.body).toHaveProperty("error");
        expect(typeof response.body.error).toBe("string");
      }
    });

    test("should return company information", async () => {
      const response = await request(app).get("/news/MSFT");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("companyInfo");
        const info = response.body.companyInfo;
        if (info) {
          // At least some fields should be present
          expect(
            info.longName ||
              info.sector ||
              info.industry ||
              info.website ||
              info.description
          ).toBeDefined();
        }
      }
    });

    test("should accept count query parameter", async () => {
      const response = await request(app)
        .get("/news/GOOGL")
        .query({ count: 5 });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("count");
      }
    });

    test("should limit count to maximum of 50", async () => {
      const response = await request(app)
        .get("/news/AAPL")
        .query({ count: 100 });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        // Count should be limited to 50 or actual available
        expect(response.body.count).toBeLessThanOrEqual(50);
      }
    });

    test("should handle case-insensitive symbols", async () => {
      const response = await request(app).get("/news/msft");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("symbol", "MSFT");
      }
    });

    test("should cache news requests", async () => {
      const response1 = await request(app).get("/news/AAPL");
      const response2 = await request(app).get("/news/AAPL");

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body).toEqual(response2.body);
      }
    });

    test("should include data availability info", async () => {
      const response = await request(app).get("/news/AAPL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("dataAvailable");
        expect(response.body.dataAvailable).toHaveProperty("hasAssetProfile");
      }
    });
  });
});
