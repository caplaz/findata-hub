/**
 * MCP Tool Definitions
 * Defines all available MCP tools with their schemas and descriptions
 *
 * @module mcp/tools
 */

// ============================================================================
// Aggregated MCP Tools for LLM Integration
// ============================================================================

/**
 * Get Stock Overview Tool
 * Get comprehensive stock overview including quote, company info, and key metrics
 */
const getStockOverviewTool = {
  name: "get_stock_overview",
  description:
    "Get a comprehensive overview of a stock including current quote, company information, and key financial metrics. This provides everything needed for a quick assessment of a company's current status and basic fundamentals.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
      },
    },
    required: ["symbol"],
  },
};

/**
 * Get Stock Analysis Tool
 * Get detailed stock analysis including recommendations, insights, performance, and news
 */
const getStockAnalysisTool = {
  name: "get_stock_analysis",
  description:
    "Get comprehensive stock analysis including analyst recommendations, insider insights, performance metrics, and recent news. This tool provides the data needed for investment analysis and decision making.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
      },
      includeNews: {
        type: "boolean",
        description: "Whether to include recent news articles (default: true)",
        default: true,
      },
      newsCount: {
        type: "number",
        description: "Number of news articles to include (default: 5, max: 20)",
        default: 5,
        minimum: 1,
        maximum: 20,
      },
    },
    required: ["symbol"],
  },
};

/**
 * Get Market Intelligence Tool
 * Get market intelligence including trending stocks, screening, and symbol search
 */
const getMarketIntelligenceTool = {
  name: "get_market_intelligence",
  description:
    "Get market intelligence including trending stocks, stock screening by criteria, and symbol search. This tool helps identify market opportunities and trends.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["trending", "screener", "search"],
        description: "Type of market intelligence to retrieve",
      },
      region: {
        type: "string",
        description: "Region for trending symbols (default: US)",
        default: "US",
      },
      screenerType: {
        type: "string",
        enum: [
          "most_actives",
          "day_gainers",
          "day_losers",
          "growth_stocks",
          "undervalued_growth_stocks",
        ],
        description: "Type of stock screener to use",
      },
      searchQuery: {
        type: "string",
        description: "Search query for symbol lookup",
      },
      count: {
        type: "number",
        description: "Number of results to return (default: 25, max: 50)",
        default: 25,
        minimum: 1,
        maximum: 50,
      },
    },
    required: ["action"],
  },
};

/**
 * Get Financial Deep Dive Tool
 * Get detailed financial statements and holdings information
 */
const getFinancialDeepDiveTool = {
  name: "get_financial_deep_dive",
  description:
    "Get detailed financial information including income statements, balance sheets, cash flow statements, and fund/ETF holdings. This tool provides comprehensive financial data for in-depth analysis.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock, ETF, or mutual fund ticker symbol",
      },
    },
    required: ["symbol"],
  },
};

/**
 * Get News and Research Tool
 * Get news and research content with article reading capability
 */
const getNewsAndResearchTool = {
  name: "get_news_and_research",
  description:
    "Get news articles, read full article content, or search for symbols. This tool provides comprehensive access to news and research content.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["news", "read", "search"],
        description: "Type of news/research action to perform",
      },
      symbol: {
        type: "string",
        description: "Stock ticker symbol (required for 'news' action)",
      },
      query: {
        type: "string",
        description: "Search query (required for 'search' action)",
      },
      url: {
        type: "string",
        description:
          "Article URL to read (required for 'read' action, must start with https://finance.yahoo.com/)",
      },
      count: {
        type: "number",
        description: "Number of results to return (default: 10, max: 25)",
        default: 10,
        minimum: 1,
        maximum: 25,
      },
    },
    required: ["action"],
  },
};

export const tools = [
  getStockOverviewTool,
  getStockAnalysisTool,
  getMarketIntelligenceTool,
  getFinancialDeepDiveTool,
  getNewsAndResearchTool,
];
