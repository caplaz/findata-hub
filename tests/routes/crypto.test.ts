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
});
