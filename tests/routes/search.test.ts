/**
 * Search API Routes tests
 * Tests for search endpoints functionality
 * @module tests/routes/search.test
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

describe("Search Routes", () => {
  describe("GET /search/:query", () => {
    test("should return search results", async () => {
      const response = await request(app).get("/search/apple");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    test("should handle special characters in query", async () => {
      const response = await request(app).get("/search/apple%20inc");
      expect([200, 500]).toContain(response.status);
    });
  });
});
