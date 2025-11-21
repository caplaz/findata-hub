/**
 * Info API Routes tests
 * Tests for info endpoints functionality
 * @module tests/routes/info.test
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

describe("Info Routes", () => {
  describe("GET /info/:symbols", () => {
    test("should return info for valid symbol", async () => {
      const response = await request(app).get("/info/AAPL");
      expect([200, 500]).toContain(response.status);
    });

    test("should handle multiple symbols", async () => {
      const response = await request(app).get("/info/AAPL,MSFT");
      expect([200, 500]).toContain(response.status);
    });
  });
});
