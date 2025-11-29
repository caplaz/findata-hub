/**
 * OpenAPI/Swagger configuration module
 * Defines the OpenAPI 3.0 specification for the API
 * @module config/swagger
 */

import { readFileSync } from "fs";
import { join } from "path";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8")
);

/**
 * Swagger/OpenAPI configuration object
 * Defines API metadata, schemas, and documentation
 * @type {Object}
 */
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Yahoo Finance API Server",
      version: packageJson.version,
      description:
        "A comprehensive REST API for Yahoo Finance data with multi-ticker support, caching, and rate limiting",
      contact: {
        name: "API Support",
        url: "https://github.com/caplaz/findata-hub",
      },
      license: {
        name: "Apache 2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0.html",
      },
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://localhost:3000",
        description: "Current server",
      },
      {
        url: "http://host.docker.internal:3000",
        description: "Docker Desktop (Windows/Mac)",
      },
      {
        url: "http://172.17.0.1:3000",
        description: "Docker Linux default gateway",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "ok",
            },
          },
        },
        QuoteData: {
          type: "object",
          description: "Stock quote data from Yahoo Finance",
        },
        HistoricalData: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", format: "date-time" },
              open: { type: "number" },
              high: { type: "number" },
              low: { type: "number" },
              close: { type: "number" },
              volume: { type: "number" },
            },
          },
        },
        CompanyInfo: {
          type: "object",
          description: "Company information and profile data",
        },
        SearchResult: {
          type: "object",
          properties: {
            quotes: {
              type: "array",
              items: { type: "object" },
            },
            news: {
              type: "array",
              items: { type: "object" },
            },
            count: { type: "number" },
          },
        },
        TrendingResult: {
          type: "object",
          properties: {
            count: { type: "number" },
            quotes: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
        RecommendationsResult: {
          type: "object",
          properties: {
            symbol: { type: "string" },
            recommendedSymbols: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
        InsightsResult: {
          type: "object",
          description: "Comprehensive stock insights and analysis",
        },
        ScreenerResult: {
          type: "object",
          properties: {
            quotes: {
              type: "array",
              items: { type: "object" },
            },
            total: { type: "number" },
          },
        },
        ETFHoldings: {
          type: "object",
          description: "Detailed ETF holdings data",
          properties: {
            holdings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  holdingPercent: { type: "number" },
                },
              },
            },
            sectorWeightings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sector: { type: "string" },
                  percentage: { type: "number" },
                },
              },
            },
            equityHoldings: {
              type: "object",
              description: "Equity holdings metrics",
            },
          },
        },
        ETFFallback: {
          type: "object",
          description:
            "Basic ETF information when detailed holdings are unavailable",
          properties: {
            fallback: { type: "boolean", example: true },
            symbol: { type: "string", example: "SPY" },
            shortName: { type: "string", example: "SPDR S&P 500 ETF Trust" },
            longName: { type: "string" },
            regularMarketPrice: { type: "number", example: 450.25 },
            marketCap: { type: "number", example: 450000000000 },
            volume: { type: "number" },
            averageVolume: { type: "number" },
            fiftyTwoWeekHigh: { type: "number" },
            fiftyTwoWeekLow: { type: "number" },
            message: {
              type: "string",
              example:
                "Detailed holdings data not available. Showing basic ETF information.",
            },
          },
        },
        FundHoldings: {
          type: "object",
          description: "Mutual fund holdings data",
          properties: {
            fundHoldings: {
              type: "object",
              properties: {
                holdings: { type: "array", items: { type: "object" } },
              },
            },
            fundProfile: {
              type: "object",
              properties: {
                categoryName: { type: "string", example: "Large Blend" },
              },
            },
          },
        },
        FinancialData: {
          type: "object",
          description: "Financial statement data",
          properties: {
            symbol: { type: "string", example: "AAPL" },
            type: {
              type: "string",
              enum: ["income", "balance", "cashflow"],
              example: "income",
            },
            period: {
              type: "string",
              enum: ["annual", "quarterly"],
              example: "annual",
            },
            data: { type: "object", description: "Financial statement data" },
          },
        },
        FinancialRatios: {
          type: "object",
          description: "Financial ratios and key statistics",
          properties: {
            summaryDetail: {
              type: "object",
              description: "Summary financial details",
            },
            defaultKeyStatistics: {
              type: "object",
              description: "Key financial statistics",
            },
            financialData: {
              type: "object",
              description: "Additional financial data",
            },
          },
        },
        NewsResult: {
          type: "object",
          description: "News articles and related information",
          properties: {
            symbol: { type: "string", example: "AAPL" },
            count: { type: "number", example: 10 },
            news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  publisher: { type: "string" },
                  link: { type: "string" },
                  publishedAt: { type: "number" },
                  type: { type: "string" },
                  thumbnail: { type: "object" },
                  relatedTickers: { type: "array", items: { type: "string" } },
                },
              },
            },
            companyInfo: { type: "object", description: "Company information" },
            summaryInfo: {
              type: "object",
              description: "Summary financial information",
            },
            message: { type: "string" },
            dataAvailable: {
              type: "object",
              description: "Data availability flags",
            },
          },
        },
        FearGreedIndex: {
          type: "object",
          description: "Fear & Greed Index data from Alternative.me",
          properties: {
            score: {
              type: "number",
              description: "Fear & Greed Index score (0-100)",
              example: 45,
            },
            rating: {
              type: "string",
              description: "Human-readable rating",
              example: "Fear",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Timestamp of the index reading",
              example: "2025-11-27T15:00:00.000Z",
            },
          },
        },
        MarketSentiment: {
          type: "object",
          description:
            "Market sentiment indicators including VIX and Fear & Greed Index",
          properties: {
            vix: {
              $ref: "#/components/schemas/Quote",
              description: "VIX (CBOE Volatility Index) data",
            },
            fearGreedIndex: {
              $ref: "#/components/schemas/FearGreedIndex",
              description: "Fear & Greed Index data (when available)",
            },
          },
        },
        CoinStatsFearGreedDataPoint: {
          type: "object",
          description: "CoinStats Fear and Greed Index data point",
          properties: {
            value: {
              type: "number",
              description: "Fear and Greed Index value (0-100)",
              example: 73,
            },
            value_classification: {
              type: "string",
              description: "Human-readable classification of the index",
              example: "Greed",
            },
            timestamp: {
              type: "number",
              description: "Unix timestamp of the data point",
              example: 1747052304,
            },
            update_time: {
              type: "string",
              format: "date-time",
              description: "ISO 8601 formatted update time (optional)",
              example: "2025-05-12T12:08:10.020Z",
            },
          },
          required: ["value", "value_classification", "timestamp"],
        },
        CoinStatsCoin: {
          type: "object",
          description: "CoinStats cryptocurrency coin data",
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for the cryptocurrency",
              example: "bitcoin",
            },
            icon: {
              type: "string",
              description: "URL to the cryptocurrency icon",
              example: "https://cdn.coinstats.app/icons/bitcoin.png",
            },
            name: {
              type: "string",
              description: "Full name of the cryptocurrency",
              example: "Bitcoin",
            },
            symbol: {
              type: "string",
              description: "Trading symbol",
              example: "BTC",
            },
            rank: {
              type: "number",
              description: "Market rank by market cap",
              example: 1,
            },
            price: {
              type: "number",
              description: "Current price in USD",
              example: 95000.5,
            },
            priceBtc: {
              type: "number",
              description: "Price in BTC",
              example: 1.0,
            },
            volume: {
              type: "number",
              description: "24h trading volume",
              example: 50000000000,
            },
            marketCap: {
              type: "number",
              description: "Market capitalization",
              example: 1800000000000,
            },
            availableSupply: {
              type: "number",
              description: "Available supply",
              example: 19000000,
            },
            totalSupply: {
              type: "number",
              description: "Total supply",
              example: 21000000,
            },
            fullyDilutedValuation: {
              type: "number",
              description: "Fully diluted valuation",
              example: 2000000000000,
            },
            priceChange1h: {
              type: "number",
              description: "Price change in the last hour (%)",
              example: 0.5,
            },
            priceChange1d: {
              type: "number",
              description: "Price change in the last 24 hours (%)",
              example: 2.3,
            },
            priceChange1w: {
              type: "number",
              description: "Price change in the last week (%)",
              example: -1.2,
            },
            websiteUrl: {
              type: "string",
              description: "Official website URL",
              example: "https://bitcoin.org",
            },
            redditUrl: {
              type: "string",
              description: "Reddit community URL",
              example: "https://reddit.com/r/bitcoin",
            },
            twitterUrl: {
              type: "string",
              description: "Twitter account URL",
              example: "https://twitter.com/bitcoin",
            },
            contractAddress: {
              type: "string",
              description: "Smart contract address (if applicable)",
              nullable: true,
              example: null,
            },
            contractAddresses: {
              type: "array",
              items: { type: "string" },
              description: "Multiple contract addresses",
            },
            decimals: {
              type: "number",
              description: "Number of decimal places",
              example: 8,
            },
            explorers: {
              type: "array",
              items: { type: "string" },
              description: "Blockchain explorer URLs",
            },
            liquidityScore: {
              type: "number",
              description: "Liquidity score",
              example: 95.5,
            },
            volatilityScore: {
              type: "number",
              description: "Volatility score",
              example: 85.2,
            },
            marketCapScore: {
              type: "number",
              description: "Market cap score",
              example: 100,
            },
            riskScore: {
              type: "number",
              description: "Risk score",
              example: 75.8,
            },
            avgChange: {
              type: "number",
              description: "Average price change",
              example: 1.5,
            },
          },
          required: [
            "id",
            "icon",
            "name",
            "symbol",
            "rank",
            "price",
            "priceBtc",
            "volume",
            "marketCap",
          ],
        },
        CoinStatsMarketData: {
          type: "object",
          description: "CoinStats global cryptocurrency market statistics",
          properties: {
            marketCap: {
              type: "number",
              description: "Total market capitalization",
              example: 2500000000000,
            },
            volume: {
              type: "number",
              description: "Total 24h trading volume",
              example: 150000000000,
            },
            btcDominance: {
              type: "number",
              description: "Bitcoin dominance percentage",
              example: 55.2,
            },
            marketCapChange: {
              type: "number",
              description: "Market cap change percentage",
              example: 2.5,
            },
            volumeChange: {
              type: "number",
              description: "Volume change percentage",
              example: -5.1,
            },
            btcDominanceChange: {
              type: "number",
              description: "BTC dominance change percentage",
              example: 0.3,
            },
          },
          required: [
            "marketCap",
            "volume",
            "btcDominance",
            "marketCapChange",
            "volumeChange",
            "btcDominanceChange",
          ],
        },
        Quote: {
          type: "object",
          description: "Yahoo Finance quote data",
          properties: {
            symbol: {
              type: "string",
              description: "Stock symbol",
              example: "AAPL",
            },
            shortName: {
              type: "string",
              description: "Short company name",
              example: "Apple Inc.",
            },
            longName: {
              type: "string",
              description: "Full company name",
              example: "Apple Inc.",
            },
            regularMarketPrice: {
              type: "number",
              description: "Current market price",
              example: 150.25,
            },
            regularMarketChange: {
              type: "number",
              description: "Price change",
              example: 2.5,
            },
            regularMarketChangePercent: {
              type: "number",
              description: "Price change percentage",
              example: 1.69,
            },
            regularMarketVolume: {
              type: "number",
              description: "Trading volume",
              example: 50000000,
            },
            marketCap: {
              type: "number",
              description: "Market capitalization",
              example: 2500000000000,
            },
            fiftyTwoWeekHigh: {
              type: "number",
              description: "52-week high",
              example: 200.0,
            },
            fiftyTwoWeekLow: {
              type: "number",
              description: "52-week low",
              example: 120.0,
            },
          },
        },
        TrendingSymbolsResult: {
          type: "object",
          description: "Trending symbols data from Yahoo Finance",
          properties: {
            count: {
              type: "number",
              description: "Number of trending symbols",
              example: 20,
            },
            quotes: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Quote",
              },
              description: "Array of trending stock quotes",
            },
          },
        },
        SearchNews: {
          type: "object",
          description: "News article data from Yahoo Finance search",
          properties: {
            title: {
              type: "string",
              description: "Article title",
              example: "Apple Reports Strong Q4 Earnings",
            },
            publisher: {
              type: "string",
              description: "News publisher",
              example: "CNBC",
            },
            link: {
              type: "string",
              description: "Article URL",
              example: "https://www.cnbc.com/article-link",
            },
            publishedAt: {
              type: "number",
              description: "Publication timestamp",
              example: 1640995200,
            },
            type: {
              type: "string",
              description: "News type",
              example: "STORY",
            },
            thumbnail: {
              type: "object",
              description: "Thumbnail image data",
            },
            relatedTickers: {
              type: "array",
              items: { type: "string" },
              description: "Related stock symbols",
              example: ["AAPL", "MSFT"],
            },
          },
        },
        HoldingsData: {
          type: "object",
          description: "ETF or mutual fund holdings data",
          properties: {
            holdings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string", example: "AAPL" },
                  holdingPercent: { type: "number", example: 15.5 },
                },
              },
              description: "List of holdings with percentages",
            },
            sectorWeightings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sector: { type: "string", example: "Technology" },
                  percentage: { type: "number", example: 25.3 },
                },
              },
              description: "Sector weightings",
            },
            equityHoldings: {
              type: "object",
              description: "Equity holdings metrics",
            },
          },
        },
        InsightsData: {
          type: "object",
          description: "Comprehensive stock insights and analysis",
          properties: {
            symbol: {
              type: "string",
              description: "Stock symbol",
              example: "AAPL",
            },
            companySnapshot: {
              type: "object",
              description: "Company overview and key metrics",
            },
            recommendationTrend: {
              type: "object",
              description: "Analyst recommendations over time",
            },
            earningsTrend: {
              type: "object",
              description: "Earnings trends and estimates",
            },
            industryTrend: {
              type: "object",
              description: "Industry comparison and trends",
            },
            indexTrend: {
              type: "object",
              description: "Market index comparison",
            },
            sectorTrend: {
              type: "object",
              description: "Sector comparison and trends",
            },
          },
        },
        CalendarEvents: {
          type: "object",
          description: "Company calendar events (earnings, dividends, etc.)",
          properties: {
            earnings: {
              type: "object",
              description: "Earnings calendar data",
            },
            dividends: {
              type: "object",
              description: "Dividend calendar data",
            },
            exDividendDate: {
              type: "string",
              format: "date",
              description: "Ex-dividend date",
              example: "2025-11-15",
            },
            dividendDate: {
              type: "string",
              format: "date",
              description: "Dividend payment date",
              example: "2025-11-20",
            },
            dividendRate: {
              type: "number",
              description: "Dividend rate",
              example: 0.96,
            },
            dividendYield: {
              type: "number",
              description: "Dividend yield percentage",
              example: 0.82,
            },
          },
        },
        KeyStatistics: {
          type: "object",
          description: "Key financial statistics and metrics",
          properties: {
            symbol: {
              type: "string",
              description: "Stock symbol",
              example: "AAPL",
            },
            enterpriseValue: {
              type: "number",
              description: "Enterprise value",
              example: 2800000000000,
            },
            forwardPE: {
              type: "number",
              description: "Forward P/E ratio",
              example: 25.5,
            },
            profitMargins: {
              type: "number",
              description: "Profit margins",
              example: 0.25,
            },
            floatShares: {
              type: "number",
              description: "Float shares",
              example: 15000000000,
            },
            sharesOutstanding: {
              type: "number",
              description: "Shares outstanding",
              example: 15500000000,
            },
            sharesShort: {
              type: "number",
              description: "Shares short",
              example: 100000000,
            },
            sharesShortPriorMonth: {
              type: "number",
              description: "Shares short prior month",
              example: 95000000,
            },
            shortRatio: {
              type: "number",
              description: "Short ratio",
              example: 2.5,
            },
            shortPercentOfFloat: {
              type: "number",
              description: "Short percent of float",
              example: 0.65,
            },
            beta: {
              type: "number",
              description: "Beta coefficient",
              example: 1.2,
            },
            morningStarOverallRating: {
              type: "number",
              description: "Morningstar overall rating",
              example: 4,
            },
            morningStarRiskRating: {
              type: "number",
              description: "Morningstar risk rating",
              example: 3,
            },
            bookValue: {
              type: "number",
              description: "Book value per share",
              example: 4.5,
            },
            priceToBook: {
              type: "number",
              description: "Price to book ratio",
              example: 8.5,
            },
            netIncomeToCommon: {
              type: "number",
              description: "Net income to common shareholders",
              example: 100000000000,
            },
            trailingEps: {
              type: "number",
              description: "Trailing EPS",
              example: 6.5,
            },
            forwardEps: {
              type: "number",
              description: "Forward EPS",
              example: 7.2,
            },
            pegRatio: {
              type: "number",
              description: "PEG ratio",
              example: 1.8,
            },
            enterpriseToRevenue: {
              type: "number",
              description: "Enterprise to revenue ratio",
              example: 8.2,
            },
            enterpriseToEbitda: {
              type: "number",
              description: "Enterprise to EBITDA ratio",
              example: 22.5,
            },
            fiftyTwoWeekChange: {
              type: "number",
              description: "52-week change percentage",
              example: 0.15,
            },
            SandP52WeekChange: {
              type: "number",
              description: "S&P 500 52-week change percentage",
              example: 0.12,
            },
            lastDividendValue: {
              type: "number",
              description: "Last dividend value",
              example: 0.96,
            },
            lastDividendDate: {
              type: "number",
              description: "Last dividend date (timestamp)",
              example: 1731628800,
            },
          },
        },
      },
    },
  },
  apis: __filename.endsWith(".ts")
    ? ["./src/routes/*.ts", "./src/mcp/*.ts"]
    : ["./dist/src/routes/*.js", "./dist/src/mcp/*.js"], // Path to the API route docs
};

export { swaggerOptions };
