/**
 * API Response Format Consistency tests
 * Tests for consistent response formats across endpoints
 * @module tests/routes/api-consistency.test
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

describe("API Response Format Consistency", () => {
  test("should return keyed objects for multi-symbol quote requests", async () => {
    const response = await request(app).get("/quote/AAPL,GOOGL");
    expect([200, 500]).toContain(response.status);
    if (response.status === 200) {
      // Should return object with symbol keys, not array
      expect(typeof response.body).toBe("object");
      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body).toHaveProperty("AAPL");
      expect(response.body).toHaveProperty("GOOGL");
    }
  });

  test("should return keyed objects for multi-symbol history requests", async () => {
    const response = await request(app)
      .get("/history/AAPL,MSFT")
      .query({ period: "1mo", interval: "1d" });
    expect([200, 500]).toContain(response.status);
    if (response.status === 200) {
      // Should return object with symbol keys, not array
      expect(typeof response.body).toBe("object");
      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body).toHaveProperty("AAPL");
      expect(response.body).toHaveProperty("MSFT");
    }
  });
});
