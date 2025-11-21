/**
 * MCP Tools Tests
 * Tests for MCP tool definitions and schemas
 * @module tests/mcp/tools.test
 */

import { tools } from "../../src/mcp/tools";

describe("MCP Tools", () => {
  describe("Tools Array", () => {
    test("should export tools array", () => {
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
    });

    test("should have expected number of tools", () => {
      expect(tools.length).toBe(14);
    });

    test("should include all required tools", () => {
      const toolNames = tools.map((t) => t.name);
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
        "get_etf_holdings",
        "get_fund_holdings",
        "read_news_article",
      ];

      for (const tool of requiredTools) {
        expect(toolNames).toContain(tool);
      }
    });
  });

  describe("Tool Schema Structure", () => {
    test("each tool should have required properties", () => {
      for (const tool of tools) {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");

        expect(typeof tool.name).toBe("string");
        expect(typeof tool.description).toBe("string");
        expect(typeof tool.inputSchema).toBe("object");
      }
    });

    test("each tool inputSchema should be valid JSON Schema", () => {
      for (const tool of tools) {
        expect(tool.inputSchema).toHaveProperty("type", "object");
        expect(tool.inputSchema).toHaveProperty("properties");
        expect(typeof tool.inputSchema.properties).toBe("object");
      }
    });
  });

  describe("Specific Tool Schemas", () => {
    test("get_stock_quote tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_quote");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain("symbols");
      expect((tool!.inputSchema.properties as any).symbols.type).toBe("string");
    });

    test("get_stock_history tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_history");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbols"]);
      expect((tool!.inputSchema.properties as any).symbols.type).toBe("string");
      expect((tool!.inputSchema.properties as any).period).toBeDefined();
      expect((tool!.inputSchema.properties as any).interval).toBeDefined();
    });

    test("get_company_info tool schema", () => {
      const tool = tools.find((t) => t.name === "get_company_info");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbols"]);
    });

    test("search_symbols tool schema", () => {
      const tool = tools.find((t) => t.name === "search_symbols");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["query"]);
      expect((tool!.inputSchema.properties as any).query.type).toBe("string");
    });

    test("get_trending_symbols tool schema", () => {
      const tool = tools.find((t) => t.name === "get_trending_symbols");
      expect(tool).toBeDefined();
      expect((tool!.inputSchema.properties as any).region).toBeDefined();
      expect((tool!.inputSchema.properties as any).region.enum).toEqual([
        "US",
        "GB",
        "AU",
        "CA",
        "FR",
        "DE",
        "HK",
        "SG",
        "IN",
      ]);
    });

    test("get_stock_recommendations tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_recommendations");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
    });

    test("get_stock_insights tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_insights");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
    });

    test("get_stock_screener tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_screener");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["type"]);
      expect((tool!.inputSchema.properties as any).type.enum).toBeDefined();
    });

    test("analyze_stock_performance tool schema", () => {
      const tool = tools.find((t) => t.name === "analyze_stock_performance");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
      expect((tool!.inputSchema.properties as any).period).toBeDefined();
    });

    test("get_financial_statement tool schema", () => {
      const tool = tools.find((t) => t.name === "get_financial_statement");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol", "statementType"]);
      expect((tool!.inputSchema.properties as any).statementType.enum).toEqual([
        "income",
        "balance",
        "cashflow",
      ]);
    });

    test("get_stock_news tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_news");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
      expect((tool!.inputSchema.properties as any).count).toBeDefined();
      expect((tool!.inputSchema.properties as any).count.type).toBe("number");
    });

    test("get_etf_holdings tool schema", () => {
      const tool = tools.find((t) => t.name === "get_etf_holdings");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
    });

    test("get_fund_holdings tool schema", () => {
      const tool = tools.find((t) => t.name === "get_fund_holdings");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
    });

    test("read_news_article tool schema", () => {
      const tool = tools.find((t) => t.name === "read_news_article");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["url"]);
      expect((tool!.inputSchema.properties as any).url.type).toBe("string");
    });
  });

  describe("Tool Descriptions", () => {
    test("all tools should have meaningful descriptions", () => {
      for (const tool of tools) {
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.description).toMatch(/[A-Z]/); // Should start with capital letter
      }
    });

    test("financial tools should mention their purpose", () => {
      const financialTool = tools.find(
        (t) => t.name === "get_financial_statement"
      );
      expect(financialTool!.description).toMatch(/financial|statement/i);
    });

    test("news tools should mention news", () => {
      const newsTool = tools.find((t) => t.name === "get_stock_news");
      expect(newsTool!.description).toMatch(/news/i);
    });
  });
});
