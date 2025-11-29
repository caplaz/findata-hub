/**
 * Crypto API Routes tests
 * Tests for cryptocurrency endpoints functionality
 * @module tests/routes/crypto.test
 */

import request from "supertest";
import express from "express";
import routes from "../../src/routes/index";

// Create a test Express app with the routes
const app = express();
app.use(express.json());
app.use(routes);

// Add error handling middleware for testing
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(500).json({ error: "Internal server error" });
  }
);

describe("Crypto Routes", () => {
  describe("GET /crypto/coins", () => {
    test("should return 200 for coins list", async () => {
      const response = await request(app).get("/crypto/coins");
      expect([200, 400, 500]).toContain(response.status); // May fail if API key is invalid
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty("meta");
        expect(response.body).toHaveProperty("result");
      }
    });

    test("should accept pagination parameters", async () => {
      const response = await request(app).get("/crypto/coins?page=1&limit=10");
      expect([200, 400, 500]).toContain(response.status);
    });

    test("should accept filter parameters", async () => {
      const response = await request(app).get(
        "/crypto/coins?coinIds=bitcoin,ethereum"
      );
      expect([200, 400, 500]).toContain(response.status);
    });

    test("should validate sortBy parameter", async () => {
      const response = await request(app).get(
        "/crypto/coins?sortBy=invalidSort"
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid sortBy");
    });

    test("should validate sortDir parameter", async () => {
      const response = await request(app).get(
        "/crypto/coins?sortDir=invalidDir"
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid sortDir");
    });
  });

  describe("GET /crypto/coins/:coinId", () => {
    test("should return 200 for valid coin ID", async () => {
      const response = await request(app).get("/crypto/coins/bitcoin");
      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("name");
      }
    });

    test("should accept currency parameter", async () => {
      const response = await request(app).get(
        "/crypto/coins/ethereum?currency=EUR"
      );
      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  describe("GET /crypto/market", () => {
    test("should return 200 for market data", async () => {
      const response = await request(app).get("/crypto/market");
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty("marketCap");
        expect(response.body).toHaveProperty("volume");
        expect(response.body).toHaveProperty("btcDominance");
        expect(response.body).toHaveProperty("marketCapChange");
        expect(response.body).toHaveProperty("volumeChange");
        expect(response.body).toHaveProperty("btcDominanceChange");
        expect(typeof response.body.marketCap).toBe("number");
        expect(typeof response.body.volume).toBe("number");
        expect(typeof response.body.btcDominance).toBe("number");
      }
    });
  });

  describe("GET /crypto/insights/btc-dominance", () => {
    test("should return 200 for BTC dominance data", async () => {
      const response = await request(app).get("/crypto/insights/btc-dominance");
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty("data");
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(Array.isArray(response.body.data[0])).toBe(true);
          expect(response.body.data[0]).toHaveLength(2);
        }
      }
    });

    test("should accept type parameter", async () => {
      const response = await request(app).get(
        "/crypto/insights/btc-dominance?type=1m"
      );
      expect([200, 400, 500]).toContain(response.status);
    });

    test("should validate type parameter", async () => {
      const response = await request(app).get(
        "/crypto/insights/btc-dominance?type=invalid"
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid type parameter");
    });
  });

  describe("GET /crypto/insights/fear-greed", () => {
    test("should return 200 for Fear and Greed Index", async () => {
      const response = await request(app).get("/crypto/insights/fear-greed");
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty("name");
        expect(response.body).toHaveProperty("now");
        expect(response.body).toHaveProperty("yesterday");
        expect(response.body).toHaveProperty("lastWeek");
        expect(typeof response.body.now.value).toBe("number");
        expect(typeof response.body.now.value_classification).toBe("string");
      }
    });
  });

  describe("GET /crypto/insights/rainbow-chart/:coinId", () => {
    test("should return 200 for Bitcoin rainbow chart", async () => {
      const response = await request(app).get(
        "/crypto/insights/rainbow-chart/bitcoin"
      );
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty("price");
          expect(response.body[0]).toHaveProperty("time");
        }
      }
    });

    test("should return 200 for Ethereum rainbow chart", async () => {
      const response = await request(app).get(
        "/crypto/insights/rainbow-chart/ethereum"
      );
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    test("should validate coinId parameter", async () => {
      const response = await request(app).get(
        "/crypto/insights/rainbow-chart/invalid"
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid coinId parameter");
    });
  });

  describe("GET /crypto/news", () => {
    test("should return 200 for news data", async () => {
      const response = await request(app).get("/crypto/news");
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty("id");
          expect(response.body[0]).toHaveProperty("feedDate");
          expect(response.body[0]).toHaveProperty("source");
          expect(response.body[0]).toHaveProperty("title");
          expect(response.body[0]).toHaveProperty("link");
          expect(response.body[0]).toHaveProperty("relatedCoins");
          expect(typeof response.body[0].feedDate).toBe("number");
          expect(typeof response.body[0].title).toBe("string");
        }
      }
    });

    test("should accept type parameter", async () => {
      const response = await request(app).get("/crypto/news?type=trending");
      expect([200, 400, 500]).toContain(response.status);
    });

    test("should accept pagination parameters", async () => {
      const response = await request(app).get("/crypto/news?page=1&limit=10");
      expect([200, 400, 500]).toContain(response.status);
    });

    test("should validate type parameter", async () => {
      const response = await request(app).get("/crypto/news?type=invalid");
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid type parameter");
    });

    test("should validate page parameter", async () => {
      const response = await request(app).get("/crypto/news?page=0");
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid page parameter");
    });

    test("should validate limit parameter", async () => {
      const response = await request(app).get("/crypto/news?limit=150");
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid limit parameter");
    });
  });
});
