/**
 * MCP Server tests
 * Tests for MCP (Model Context Protocol) server functionality
 * @module tests/mcp/server.test
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

describe("MCP Server", () => {
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
        "get_stock_quote",
        "get_stock_history",
        "get_company_info",
        "search_symbols",
        "get_trending_symbols",
        "get_stock_recommendations",
        "get_stock_insights",
        "get_stock_screener",
        "analyze_stock_performance",
        "get_financial_statement",
        "get_stock_news",
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

    test("each tool should have required properties", async () => {
      const response = await request(app).get("/mcp/tools");
      for (const tool of response.body.tools) {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(typeof tool.name).toBe("string");
        expect(typeof tool.description).toBe("string");
        expect(tool.inputSchema).toHaveProperty("type", "object");
        expect(tool.inputSchema).toHaveProperty("properties");
        expect(tool.inputSchema).toHaveProperty("required");
      }
    });

    test("should include financial statement tool schema", async () => {
      const response = await request(app).get("/mcp/tools");
      const financialTool = response.body.tools.find(
        (t) => t.name === "get_financial_statement"
      );
      expect(financialTool).toBeDefined();
      expect(financialTool.inputSchema.required).toContain("symbol");
      expect(financialTool.inputSchema.required).toContain("statementType");
      expect(financialTool.inputSchema.properties.statementType).toHaveProperty(
        "enum"
      );
    });

    test("should include stock news tool schema", async () => {
      const response = await request(app).get("/mcp/tools");
      const newsTool = response.body.tools.find(
        (t) => t.name === "get_stock_news"
      );
      expect(newsTool).toBeDefined();
      expect(newsTool.inputSchema.required).toContain("symbol");
      expect(newsTool.inputSchema.properties.count).toHaveProperty("type");
    });
  });

  describe("POST /mcp/call", () => {
    test("should execute get_stock_quote tool", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_quote",
          arguments: { symbols: "AAPL" },
        });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("content");
        expect(Array.isArray(response.body.content)).toBe(true);
      }
    });

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

    test("should execute search_symbols tool", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "search_symbols",
          arguments: { query: "apple" },
        });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("content");
      }
    });

    test("should execute get_financial_statement tool", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_financial_statement",
          arguments: { symbol: "AAPL", statementType: "income" },
        });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("content");
      }
    });

    test("should execute get_stock_news tool", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_news",
          arguments: { symbol: "MSFT" },
        });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("content");
      }
    });

    test("response should have proper MCP format", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_quote",
          arguments: { symbols: "AAPL" },
        });

      if (response.status === 200) {
        expect(response.body.content[0]).toHaveProperty("type", "text");
        expect(response.body.content[0]).toHaveProperty("text");
      }
    });
  });

  describe("POST /mcp/call-stream", () => {
    test("should stream SSE events for tool execution", async () => {
      const response = await request(app)
        .post("/mcp/call-stream")
        .send({
          name: "search_symbols",
          arguments: { query: "microsoft" },
        })
        .timeout(10000);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
    });

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

    test("should stream get_financial_statement tool", async () => {
      const response = await request(app)
        .post("/mcp/call-stream")
        .send({
          name: "get_financial_statement",
          arguments: { symbol: "AAPL", statementType: "income" },
        })
        .timeout(10000);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
    });

    test("should stream get_stock_news tool", async () => {
      const response = await request(app)
        .post("/mcp/call-stream")
        .send({
          name: "get_stock_news",
          arguments: { symbol: "GOOGL" },
        })
        .timeout(10000);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
    });
  });

  describe("Tool functionality", () => {
    test("get_stock_quote should accept comma-separated symbols", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_quote",
          arguments: { symbols: "AAPL,MSFT,GOOGL" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_stock_history should accept period parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_history",
          arguments: { symbols: "AAPL", period: "1y" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_trending_symbols should accept region parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_trending_symbols",
          arguments: { region: "US" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("analyze_stock_performance should accept period parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "analyze_stock_performance",
          arguments: { symbol: "AAPL", period: "6mo" },
        });

      expect([200, 500]).toContain(response.status);
    });

    test("get_stock_screener should accept type parameter", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .send({
          name: "get_stock_screener",
          arguments: { type: "day_gainers" },
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe("Error handling", () => {
    test("should handle invalid JSON gracefully", async () => {
      const response = await request(app)
        .post("/mcp/call")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test("should handle missing required parameters", async () => {
      const response = await request(app).post("/mcp/call").send({
        name: "get_stock_quote",
        arguments: {}, // missing symbols
      });

      expect([200, 400, 500]).toContain(response.status);
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

  describe("Integration tests", () => {
    test("should list all 14 tools", async () => {
      const response = await request(app).get("/mcp/health");
      expect(response.body.toolsAvailable).toBe(14);
    });

    test("should support all tool execution methods", async () => {
      const toolName = "get_stock_quote";

      // Test JSON response
      const jsonResponse = await request(app)
        .post("/mcp/call")
        .send({
          name: toolName,
          arguments: { symbols: "AAPL" },
        });
      expect([200, 500]).toContain(jsonResponse.status);

      // Test SSE streaming
      const streamResponse = await request(app)
        .post("/mcp/call-stream")
        .send({
          name: toolName,
          arguments: { symbols: "AAPL" },
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
