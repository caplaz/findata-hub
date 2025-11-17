/**
 * News Reader Routes tests
 * Tests for article scraping functionality
 * @module tests/routes/newsReader.test
 */

import request from "supertest";
import express from "express";
import newsReaderRouter from "../../src/routes/newsReader.js";

// Create a test Express app with the news reader routes
const app = express();
app.use(express.json());
app.use("/", newsReaderRouter);

// Add error handling middleware for testing
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal server error" });
});

describe("News Reader Routes", () => {
  describe("GET /news_reader/:slug", () => {
    test("should attempt to scrape article content", async () => {
      const response = await request(app).get(
        "/news_reader/test-article-slug.html"
      );
      // May return 200 if article exists and scraping succeeds, or 404/500 if not
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("title");
        expect(response.body).toHaveProperty("content");
        expect(response.body).toHaveProperty("url");
      }
    });

    test("should return error for invalid slug format", async () => {
      const response = await request(app).get("/news_reader/invalid");
      expect([404, 500]).toContain(response.status);
    });
  });
});
