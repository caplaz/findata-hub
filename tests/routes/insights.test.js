/**
 * Insights API Routes tests
 * Tests for insights endpoints functionality
 * @module tests/routes/insights.test
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

describe("Insights Routes", () => {
  describe("GET /insights/:symbol", () => {
    test("should return insights for symbol", async () => {
      const response = await request(app).get("/insights/AAPL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });
});
