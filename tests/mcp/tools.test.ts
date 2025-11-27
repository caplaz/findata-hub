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
      expect(tools.length).toBe(5);
    });

    test("should include all required tools", () => {
      const toolNames = tools.map((t) => t.name);
      const requiredTools = [
        "get_stock_overview",
        "get_stock_analysis",
        "get_market_intelligence",
        "get_financial_deep_dive",
        "get_news_and_research",
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
    test("get_stock_overview tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_overview");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
      expect((tool!.inputSchema.properties as any).symbol.type).toBe("string");
    });

    test("get_stock_analysis tool schema", () => {
      const tool = tools.find((t) => t.name === "get_stock_analysis");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
      expect((tool!.inputSchema.properties as any).symbol.type).toBe("string");
      expect((tool!.inputSchema.properties as any).includeNews).toBeDefined();
      expect((tool!.inputSchema.properties as any).newsCount).toBeDefined();
    });

    test("get_market_intelligence tool schema", () => {
      const tool = tools.find((t) => t.name === "get_market_intelligence");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["action"]);
      expect((tool!.inputSchema.properties as any).action.enum).toBeDefined();
      expect((tool!.inputSchema.properties as any).region).toBeDefined();
      expect((tool!.inputSchema.properties as any).screenerType).toBeDefined();
      expect((tool!.inputSchema.properties as any).searchQuery).toBeDefined();
      expect((tool!.inputSchema.properties as any).count).toBeDefined();
    });

    test("get_financial_deep_dive tool schema", () => {
      const tool = tools.find((t) => t.name === "get_financial_deep_dive");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["symbol"]);
      expect((tool!.inputSchema.properties as any).symbol.type).toBe("string");
    });

    test("get_news_and_research tool schema", () => {
      const tool = tools.find((t) => t.name === "get_news_and_research");
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toEqual(["action"]);
      expect((tool!.inputSchema.properties as any).action.enum).toBeDefined();
      expect((tool!.inputSchema.properties as any).symbol).toBeDefined();
      expect((tool!.inputSchema.properties as any).query).toBeDefined();
      expect((tool!.inputSchema.properties as any).url).toBeDefined();
      expect((tool!.inputSchema.properties as any).count).toBeDefined();
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
        (t) => t.name === "get_financial_deep_dive"
      );
      expect(financialTool!.description).toMatch(/financial|deep.dive/i);
    });

    test("news tools should mention news", () => {
      const newsTool = tools.find((t) => t.name === "get_news_and_research");
      expect(newsTool!.description).toMatch(/news|research/i);
    });
  });
});
