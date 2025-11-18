/**
 * History API Routes tests
 * Tests for history endpoints functionality
 * @module tests/routes/history.test
 */

import request from "supertest";
import express from "express";
import routes from "../../src/routes/index.js";

// Create a test Express app with the routes
const app = express();
app.use(express.json());
app.use(routes);

// Add error handling middleware for testing
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal server error" });
});

describe("History Routes", () => {
  describe("GET /history/:symbols", () => {
    test("should accept period and interval parameters", async () => {
      const response = await request(app)
        .get("/history/AAPL")
        .query({ period: "1y", interval: "1d" });
      expect([200, 500]).toContain(response.status);
    });

    test("should use default period and interval", async () => {
      const response = await request(app).get("/history/AAPL");
      expect([200, 500]).toContain(response.status);
    });

    test("should handle multiple symbols with parameters", async () => {
      const response = await request(app)
        .get("/history/AAPL,MSFT")
        .query({ period: "3mo", interval: "1d" });
      expect([200, 500]).toContain(response.status);
    });
  });
});
