/**
 * MCP (Model Context Protocol) Server Implementation
 * Uses official @modelcontextprotocol/sdk for protocol-compliant MCP server
 *
 * @module mcp/mcpServer
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import { log } from "../utils/logger";

import { toolHandlers } from "./handlers";

/**
 * Create and configure the MCP server with all financial tools
 */
export function createMcpServer(): McpServer {
  log("info", "🤖 Initializing MCP Server with @modelcontextprotocol/sdk");

  const server = new McpServer({
    name: "yahoo-finance-mcp",
    version: "2.0.2",
  });

  log("info", "📊 Registering 5 financial data tools...");

  // ============================================================================
  // Register Stock Overview Tool
  // ============================================================================
  server.registerTool(
    "get_stock_overview",
    {
      title: "Stock Overview",
      description:
        "Get a comprehensive overview of a stock including current quote, company information, and key financial metrics. This provides everything needed for a quick assessment of a company's current status and basic fundamentals.",
      inputSchema: {
        symbol: z
          .string()
          .describe("Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)"),
      },
    },
    async ({ symbol }) => {
      log("debug", `🔍 Executing get_stock_overview for symbol: ${symbol}`);
      try {
        const result = await toolHandlers.get_stock_overview(symbol);
        log("debug", `✅ get_stock_overview completed for ${symbol}`);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        log("error", `❌ get_stock_overview failed for ${symbol}:`, error);
        throw error;
      }
    }
  );
  log("info", "✅ Registered tool: get_stock_overview");

  // ============================================================================
  // Register Stock Analysis Tool
  // ============================================================================
  server.registerTool(
    "get_stock_analysis",
    {
      title: "Stock Analysis",
      description:
        "Get comprehensive stock analysis including analyst recommendations, insider insights, performance metrics, and recent news. This tool provides the data needed for investment analysis and decision making.",
      inputSchema: {
        symbol: z
          .string()
          .describe("Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)"),
        includeNews: z
          .boolean()
          .default(true)
          .describe("Whether to include recent news articles (default: true)"),
        newsCount: z
          .number()
          .min(1)
          .max(20)
          .default(5)
          .describe("Number of news articles to include (default: 5, max: 20)"),
      },
    },
    async ({ symbol, includeNews, newsCount }) => {
      log(
        "debug",
        `🔍 Executing get_stock_analysis for symbol: ${symbol} (news: ${
          includeNews ?? true
        }, count: ${newsCount ?? 5})`
      );
      try {
        const result = await toolHandlers.get_stock_analysis(
          symbol,
          includeNews ?? true,
          newsCount ?? 5
        );
        log("debug", `✅ get_stock_analysis completed for ${symbol}`);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        log("error", `❌ get_stock_analysis failed for ${symbol}:`, error);
        throw error;
      }
    }
  );
  log("info", "✅ Registered tool: get_stock_analysis");

  // ============================================================================
  // Register Market Intelligence Tool
  // ============================================================================
  server.registerTool(
    "get_market_intelligence",
    {
      title: "Market Intelligence",
      description:
        "Get market intelligence including trending stocks, stock screening by criteria, and symbol search. This tool helps identify market opportunities and trends.",
      inputSchema: {
        action: z
          .enum(["trending", "screener", "search"])
          .describe("Type of market intelligence to retrieve"),
        region: z
          .string()
          .default("US")
          .describe("Region for trending symbols (default: US)"),
        screenerType: z
          .enum([
            "most_actives",
            "day_gainers",
            "day_losers",
            "growth_stocks",
            "undervalued_growth_stocks",
          ])
          .optional()
          .describe("Type of stock screener to use"),
        searchQuery: z
          .string()
          .optional()
          .describe("Search query for symbol lookup"),
        count: z
          .number()
          .min(1)
          .max(50)
          .default(25)
          .describe("Number of results to return (default: 25, max: 50)"),
      },
    },
    async ({ action, region, screenerType, searchQuery, count }) => {
      log(
        "debug",
        `🔍 Executing get_market_intelligence - action: ${action}, region: ${
          region ?? "US"
        }, count: ${count ?? 25}`
      );
      try {
        const result = await toolHandlers.get_market_intelligence(
          action,
          region ?? "US",
          screenerType,
          searchQuery,
          count ?? 25
        );
        log(
          "debug",
          `✅ get_market_intelligence completed for action: ${action}`
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        log(
          "error",
          `❌ get_market_intelligence failed for action ${action}:`,
          error
        );
        throw error;
      }
    }
  );
  log("info", "✅ Registered tool: get_market_intelligence");

  // ============================================================================
  // Register Financial Deep Dive Tool
  // ============================================================================
  server.registerTool(
    "get_financial_deep_dive",
    {
      title: "Financial Deep Dive",
      description:
        "Get detailed financial information including income statements, balance sheets, cash flow statements, and fund/ETF holdings. This tool provides comprehensive financial data for in-depth analysis.",
      inputSchema: {
        symbol: z.string().describe("Stock, ETF, or mutual fund ticker symbol"),
      },
    },
    async ({ symbol }) => {
      log(
        "debug",
        `🔍 Executing get_financial_deep_dive for symbol: ${symbol}`
      );
      try {
        const result = await toolHandlers.get_financial_deep_dive(symbol);
        log("debug", `✅ get_financial_deep_dive completed for ${symbol}`);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        log("error", `❌ get_financial_deep_dive failed for ${symbol}:`, error);
        throw error;
      }
    }
  );
  log("info", "✅ Registered tool: get_financial_deep_dive");

  // ============================================================================
  // Register News and Research Tool
  // ============================================================================
  server.registerTool(
    "get_news_and_research",
    {
      title: "News and Research",
      description:
        "Get news articles, read full article content, or search for symbols. This tool provides comprehensive access to news and research content.",
      inputSchema: {
        action: z
          .enum(["news", "read", "search"])
          .describe("Type of news/research action to perform"),
        symbol: z
          .string()
          .optional()
          .describe("Stock ticker symbol (required for 'news' action)"),
        query: z
          .string()
          .optional()
          .describe("Search query (required for 'search' action)"),
        url: z
          .string()
          .optional()
          .describe(
            "Article URL to read (required for 'read' action, must start with https://finance.yahoo.com/)"
          ),
        count: z
          .number()
          .min(1)
          .max(25)
          .default(10)
          .describe("Number of results to return (default: 10, max: 25)"),
      },
    },
    async ({ action, symbol, query, url, count }) => {
      log(
        "debug",
        `🔍 Executing get_news_and_research - action: ${action}, symbol: ${symbol}, query: ${query}, count: ${
          count ?? 10
        }`
      );
      try {
        const result = await toolHandlers.get_news_and_research(
          action,
          symbol,
          query,
          url,
          count ?? 10
        );
        log(
          "debug",
          `✅ get_news_and_research completed for action: ${action}`
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        log(
          "error",
          `❌ get_news_and_research failed for action ${action}:`,
          error
        );
        throw error;
      }
    }
  );
  log("info", "✅ Registered tool: get_news_and_research");

  log(
    "info",
    "🎉 MCP Server initialization complete - 5 tools registered and ready"
  );
  return server;
}

// Export singleton server instance
export const mcpServer = createMcpServer();
