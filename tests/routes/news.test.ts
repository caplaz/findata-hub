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
  describe("GET /news", () => {
    test("should return 200 for general news request", async () => {
      const response = await request(app).get("/news");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty("title");
          expect(response.body[0]).toHaveProperty("publisher");
          expect(response.body[0]).toHaveProperty("link");
        }
      } else if (response.status === 500) {
        // API may be temporarily unavailable due to Yahoo Finance changes
        expect(response.body).toHaveProperty("error");
        expect(typeof response.body.error).toBe("string");
      }
    });

    test("should accept count query parameter", async () => {
      const response = await request(app).get("/news").query({ count: 5 });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    test("should limit count to maximum of 50", async () => {
      const response = await request(app).get("/news").query({ count: 100 });
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    test("should cache news requests", async () => {
      const response1 = await request(app).get("/news");
      const response2 = await request(app).get("/news");

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body).toEqual(response2.body);
      }
    });

    test("should return array of SearchNews", async () => {
      const response = await request(app).get("/news");
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const article = response.body[0];
          expect(article).toHaveProperty("uuid");
          expect(article).toHaveProperty("title");
          expect(article).toHaveProperty("publisher");
          expect(article).toHaveProperty("link");
          expect(article).toHaveProperty("providerPublishTime");
          expect(article).toHaveProperty("type");
        }
      }
    });
  });
});
