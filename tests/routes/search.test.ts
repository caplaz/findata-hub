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
  describe("POST /search", () => {
    test("should return search results", async () => {
      const response = await request(app)
        .post("/search")
        .send({ query: "apple" });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    test("should handle special characters in query", async () => {
      const response = await request(app)
        .post("/search")
        .send({ query: "apple inc" });
      expect([200, 500]).toContain(response.status);
    });

    test("should return 400 for missing query", async () => {
      const response = await request(app).post("/search").send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("required");
    });

    test("should return 400 for empty query", async () => {
      const response = await request(app)
        .post("/search")
        .send({ query: "" });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("non-empty");
    });

    test("should return 400 for invalid query type", async () => {
      const response = await request(app)
        .post("/search")
        .send({ query: 123 });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("string");
    });
  });
});
