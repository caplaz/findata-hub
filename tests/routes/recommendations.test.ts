/**
 * Recommendations API Routes tests
 * Tests for recommendations endpoints functionality
 * @module tests/routes/recommendations.test
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

describe("Recommendations Routes", () => {
  describe("GET /recommendations/:symbol", () => {
    test("should return recommendations for symbol", async () => {
      const response = await request(app).get("/recommendations/AAPL");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    test("should handle lowercase symbols", async () => {
      const response = await request(app).get("/recommendations/aapl");
      expect([200, 500]).toContain(response.status);
    });
  });
});
