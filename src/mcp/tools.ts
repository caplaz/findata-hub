/**
 * MCP Tool Definitions
 * Defines all available MCP tools with their schemas and descriptions
 *
 * @module mcp/tools
 */

// ============================================================================
// Tool Definitions (MCP Compliant)
// ============================================================================

/**
 * Stock Quote Tool
 * Get current stock quotes for one or more ticker symbols
 */
const getStockQuoteTool = {
  name: "get_stock_quote",
  description:
    "Get current stock quotes for one or more ticker symbols. Returns price, currency, market cap, and other key metrics.",
  inputSchema: {
    type: "object",
    properties: {
      symbols: {
        type: "string",
        description:
          "Comma-separated list of stock ticker symbols (e.g., 'AAPL,GOOGL,MSFT')",
      },
    },
    required: ["symbols"],
  },
};

/**
 * Stock History Tool
 * Get historical price data for stocks
 */
const getStockHistoryTool = {
  name: "get_stock_history",
  description:
    "Get historical price data for a stock symbol with configurable period and interval.",
  inputSchema: {
    type: "object",
    properties: {
      symbols: {
        type: "string",
        description:
          "Comma-separated list of stock ticker symbols (e.g., 'AAPL,GOOGL')",
      },
      period: {
        type: "string",
        enum: [
          "1d",
          "5d",
          "1wk",
          "1mo",
          "3mo",
          "6mo",
          "1y",
          "2y",
          "5y",
          "10y",
          "max",
        ],
        description: "Time period for historical data (default: '1y')",
      },
      interval: {
        type: "string",
        enum: ["1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo"],
        description: "Data interval frequency (default: '1d')",
      },
    },
    required: ["symbols"],
  },
};

/**
 * Company Info Tool
 * Get comprehensive company information
 */
const getCompanyInfoTool = {
  name: "get_company_info",
  description:
    "Get comprehensive company information including business summary, industry, website, and executives.",
  inputSchema: {
    type: "object",
    properties: {
      symbols: {
        type: "string",
        description:
          "Comma-separated list of stock ticker symbols (e.g., 'AAPL,MSFT')",
      },
    },
    required: ["symbols"],
  },
};

/**
 * Search Symbols Tool
 * Search for stocks, ETFs, and indices
 */
const searchSymbolsTool = {
  name: "search_symbols",
  description:
    "Search for stocks, ETFs, and indices by company name, symbol, or keyword. Returns matching results with company details.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (company name, symbol, or keyword)",
      },
    },
    required: ["query"],
  },
};

/**
 * Trending Symbols Tool
 * Get trending/most watched stocks by region
 */
const getTrendingSymbolsTool = {
  name: "get_trending_symbols",
  description:
    "Get trending/most watched stocks by region. Useful for market analysis and finding hot stocks.",
  inputSchema: {
    type: "object",
    properties: {
      region: {
        type: "string",
        enum: ["US", "GB", "AU", "CA", "FR", "DE", "HK", "SG", "IN"],
        description: "Region code (default: 'US')",
      },
    },
    required: [],
  },
};

/**
 * Stock Recommendations Tool
 * Get similar stock recommendations
 */
const getStockRecommendationsTool = {
  name: "get_stock_recommendations",
  description:
    "Get similar stock recommendations based on a given stock symbol. Useful for investment research and portfolio diversification.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., 'AAPL')",
      },
    },
    required: ["symbol"],
  },
};

/**
 * Stock Insights Tool
 * Get comprehensive stock insights
 */
const getStockInsightsTool = {
  name: "get_stock_insights",
  description:
    "Get comprehensive stock insights including research, news sentiment, insider trades, and analyst recommendations.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., 'AAPL')",
      },
    },
    required: ["symbol"],
  },
};

/**
 * Stock Screener Tool
 * Get lists of stocks by specific criteria
 */
const getStockScreenerTool = {
  name: "get_stock_screener",
  description:
    "Get lists of stocks by specific criteria (gainers, losers, active stocks, etc.). Useful for market analysis and trading strategies.",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "day_gainers",
          "day_losers",
          "most_actives",
          "most_shorted",
          "growth_tech_stocks",
          "day_gainers_etf",
          "day_losers_etf",
        ],
        description: "Type of screener to retrieve",
      },
      count: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Number of results to return (default: 25)",
      },
    },
    required: ["type"],
  },
};

/**
 * Stock Performance Analysis Tool
 * Analyze stock performance over time
 */
const analyzeStockPerformanceTool = {
  name: "analyze_stock_performance",
  description:
    "Analyze stock performance by comparing current price against historical data. Returns performance metrics and trends.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., 'AAPL')",
      },
      period: {
        type: "string",
        enum: ["1d", "5d", "1wk", "1mo", "3mo", "6mo", "1y", "max"],
        description: "Period for performance analysis (default: '1y')",
      },
    },
    required: ["symbol"],
  },
};

/**
 * Financial Statement Tool
 * Get financial statements (income, balance sheet, cash flow)
 */
const getFinancialStatementTool = {
  name: "get_financial_statement",
  description:
    "Get financial statements for a stock including income statement, balance sheet, and cash flow statement. Can retrieve annual or quarterly data.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., 'AAPL', 'MSFT')",
      },
      statementType: {
        type: "string",
        enum: ["income", "balance", "cashflow"],
        description:
          "Type of financial statement: 'income' (income statement), 'balance' (balance sheet), or 'cashflow' (cash flow statement)",
      },
      period: {
        type: "string",
        enum: ["annual", "quarterly"],
        description: "Period type: 'annual' or 'quarterly' (default: 'annual')",
      },
    },
    required: ["symbol", "statementType"],
  },
};

/**
 * Stock News Tool
 * Get latest news articles for stocks
 */
const getStockNewsTool = {
  name: "get_stock_news",
  description:
    "Get latest news articles and headlines for a stock symbol. Provides real-time market context and sentiment.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., 'AAPL', 'GOOGL')",
      },
      count: {
        type: "number",
        description: "Number of news articles to return (default: 10, max: 50)",
      },
    },
    required: ["symbol"],
  },
};

/**
 * ETF Holdings Tool
 * Get ETF holdings and sector weightings
 */
const getEtfHoldingsTool = {
  name: "get_etf_holdings",
  description:
    "Get ETF holdings, sector allocations, and position breakdowns. Useful for analyzing ETF composition.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "ETF ticker symbol (e.g., 'SPY', 'QQQ')",
      },
    },
    required: ["symbol"],
  },
};

/**
 * Mutual Fund Holdings Tool
 * Get mutual fund holdings and composition
 */
const getFundHoldingsTool = {
  name: "get_fund_holdings",
  description:
    "Get mutual fund holdings and composition data. Useful for analyzing mutual fund portfolios.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Mutual fund ticker symbol (e.g., 'VFIAX')",
      },
    },
    required: ["symbol"],
  },
};

/**
 * News Reader Tool
 * Extract content from Yahoo Finance news articles
 */
const readNewsArticleTool = {
  name: "read_news_article",
  description:
    "Extract the main title and text content from a Yahoo Finance news article URL.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description:
          "The full Yahoo Finance article URL (must start with https://finance.yahoo.com/)",
      },
    },
    required: ["url"],
  },
};

export const tools = [
  getStockQuoteTool,
  getStockHistoryTool,
  getCompanyInfoTool,
  searchSymbolsTool,
  getTrendingSymbolsTool,
  getStockRecommendationsTool,
  getStockInsightsTool,
  getStockScreenerTool,
  analyzeStockPerformanceTool,
  getFinancialStatementTool,
  getStockNewsTool,
  getEtfHoldingsTool,
  getFundHoldingsTool,
  readNewsArticleTool,
];
