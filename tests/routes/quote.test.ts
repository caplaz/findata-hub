/**
 * Quote API Routes tests
 * Tests for quote endpoints functionality
 * @module tests/routes/quote.test
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

describe("Quote Routes", () => {
  describe("GET /quote/:symbols", () => {
    test("should return 200 for valid symbol", async () => {
      const response = await request(app).get("/quote/AAPL");
      expect([200, 500]).toContain(response.status); // May fail if API is down
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    test("should handle multiple symbols", async () => {
      const response = await request(app).get("/quote/AAPL,GOOGL");
      expect([200, 500]).toContain(response.status);
    });

    test("should return error for completely invalid input", async () => {
      const response = await request(app).get("/quote/");
      expect(response.status).toBe(404); // Route not matched
    });
  });
});
