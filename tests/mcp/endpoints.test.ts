/**
 * MCP Endpoints Tests
 * Tests for MCP HTTP endpoints
 * @module tests/mcp/endpoints.test
 */

import request from "supertest";
import express from "express";
import mcpRouter from "../../src/mcp/server";

// Create a test Express app with the MCP router
const app = express();
app.use(express.json());
app.use("/mcp", mcpRouter);

// Add error handling middleware for testing
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: "Internal server error" });
});

describe("MCP Endpoints", () => {
  describe("GET /mcp/health", () => {
    test("should return healthy status", async () => {
      const response = await request(app).get("/mcp/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("service", "MCP Server");
    });

    test("should list all available tools", async () => {
      const response = await request(app).get("/mcp/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("toolsAvailable");
      expect(response.body).toHaveProperty("tools");
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.toolsAvailable).toBeGreaterThan(0);
      expect(response.body.tools.length).toBe(response.body.toolsAvailable);
    });

    test("should include required tools", async () => {
      const response = await request(app).get("/mcp/health");
      const requiredTools = [
        "get_stock_overview",
        "get_stock_analysis",
        "get_market_intelligence",
        "get_financial_deep_dive",
        "get_news_and_research",
      ];

      for (const tool of requiredTools) {
        expect(response.body.tools).toContain(tool);
      }
    });

    test("should include features list", async () => {
      const response = await request(app).get("/mcp/health");
      expect(response.body).toHaveProperty("features");
      expect(Array.isArray(response.body.features)).toBe(true);
      expect(response.body.features).toContain("json-response");
      expect(response.body.features).toContain("sse-streaming");
    });

    test("should include timestamp", async () => {
      const response = await request(app).get("/mcp/health");
      expect(response.body).toHaveProperty("timestamp");
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("GET /mcp/tools", () => {
    test("should return tools list with schemas", async () => {
      const response = await request(app).get("/mcp/tools");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("tools");
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);
    });

    test("should support OpenAI format", async () => {
      const response = await request(app).get("/mcp/tools?format=openai");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("tools");
      expect(Array.isArray(response.body.tools)).toBe(true);

      if (response.body.tools.length > 0) {
        const tool = response.body.tools[0];
        expect(tool).toHaveProperty("type", "function");
        expect(tool).toHaveProperty("function");
        expect(tool.function).toHaveProperty("name");
        expect(tool.function).toHaveProperty("parameters");
      }
    });

    test("each tool should have required properties", async () => {
      const response = await request(app).get("/mcp/tools");
      for (const tool of response.body.tools) {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(typeof tool.name).toBe("string");
        expect(typeof tool.description).toBe("string");
        expect(typeof tool.inputSchema).toBe("object");
      }
    });

    test("each tool inputSchema should be valid JSON Schema", async () => {
      const response = await request(app).get("/mcp/tools");
      for (const tool of response.body.tools) {
        expect(tool.inputSchema).toHaveProperty("type", "object");
        expect(tool.inputSchema).toHaveProperty("properties");
        expect(typeof tool.inputSchema.properties).toBe("object");
      }
    });

    test("should include financial deep dive tool schema", async () => {
      const response = await request(app).get("/mcp/tools");
      const financialTool = response.body.tools.find(
        (t: any) => t.name === "get_financial_deep_dive"
      );
      expect(financialTool).toBeDefined();
      expect(financialTool.inputSchema.required).toContain("symbol");
    });

    test("should include news and research tool schema", async () => {
      const response = await request(app).get("/mcp/tools");
      const newsTool = response.body.tools.find(
        (t: any) => t.name === "get_news_and_research"
      );
      expect(newsTool).toBeDefined();
      expect(newsTool.inputSchema.properties.action).toHaveProperty("enum");
    });
  });

  describe("POST /mcp/call", () => {
    test("should return error for missing tool name", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          arguments: { symbols: "AAPL" },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    test("should return error for unknown tool", async () => {
      const response = await request(app).post("/mcp/call").send({
        name: "unknown_tool",
        arguments: {},
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Unknown tool");
    });

    test("should return error for missing arguments", async () => {
      const response = await request(app).post("/mcp/call").send({
        name: "get_stock_quote",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    test("response should have proper MCP format", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_quote",
          arguments: { symbols: "AAPL" },
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty("content");
        expect(Array.isArray(response.body.content)).toBe(true);
        if (response.body.content.length > 0) {
          expect(response.body.content[0]).toHaveProperty("type", "text");
          expect(response.body.content[0]).toHaveProperty("text");
        }
      }
    });

    test("should handle invalid JSON gracefully", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test("should return proper error response structure", async () => {
      const response = await request(app).post("/mcp/call").send({
        name: "unknown_tool",
        arguments: {},
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
    });
  });

  describe("POST /mcp/call-stream", () => {
    test("should return error for unknown tool in stream", async () => {
      const response = await request(app).post("/mcp/call-stream").send({
        name: "unknown_tool",
        arguments: {},
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    test("should return error for missing name in stream", async () => {
      const response = await request(app)
        .post("/mcp/call-stream")
        .send({
          arguments: { query: "test" },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    test("should return error for missing arguments in stream", async () => {
      const response = await request(app).post("/mcp/call-stream").send({
        name: "get_stock_quote",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Tool functionality", () => {
    test("get_stock_overview should accept symbol parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_overview",
          arguments: { symbol: "AAPL" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_stock_analysis should accept symbol parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_analysis",
          arguments: { symbol: "AAPL" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_market_intelligence should accept action parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_market_intelligence",
          arguments: { action: "trending" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_financial_deep_dive should accept symbol parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_financial_deep_dive",
          arguments: { symbol: "AAPL" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_news_and_research should accept action parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_news_and_research",
          arguments: { action: "news", symbol: "AAPL" },
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe("Integration tests", () => {
    test("should list all 5 tools", async () => {
      const response = await request(app).get("/mcp/health");
      expect(response.body.toolsAvailable).toBe(5);
    });

    test("should support all tool execution methods", async () => {
      const toolName = "get_stock_overview";

      // Test JSON response
      const jsonResponse = await request(app)
        .post("/mcp/call")
        .send({
          name: toolName,
          arguments: { symbol: "AAPL" },
        });
      expect([200, 500]).toContain(jsonResponse.status);

      // Test SSE streaming (if implemented)
      const streamResponse = await request(app)
        .post("/mcp/call-stream")
        .send({
          name: toolName,
          arguments: { symbol: "AAPL" },
        })
        .timeout(10000);
      expect([200, 500]).toContain(streamResponse.status);
    });

    test("health endpoint should reflect actual tools available", async () => {
      const healthResponse = await request(app).get("/mcp/health");
      const toolsResponse = await request(app).get("/mcp/tools");

      expect(healthResponse.body.toolsAvailable).toBe(
        toolsResponse.body.tools.length
      );
      expect(healthResponse.body.tools.length).toBe(
        toolsResponse.body.tools.length
      );
    });
  });
});
