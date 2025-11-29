# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-29

### Added

- **Initial Release**: Complete financial data hub with comprehensive stock and cryptocurrency APIs

- **Cryptocurrency API Integration**: Full CoinStats API support for real-time cryptocurrency data

  - `GET /crypto/coins` - Retrieve cryptocurrency listings with advanced filtering and sorting
    - Support for limit, offset, currency, orderBy, and orderDirection parameters
    - Real-time price data, market cap, volume, and price changes
    - Multiple currency support (USD, EUR, BTC, ETH)
    - Sorting by market cap, price, volume, and price changes
  - `GET /crypto/coins/:coinId` - Detailed information for specific cryptocurrencies
    - Comprehensive coin data including price history, market metrics, and metadata
    - Support for multiple currencies and detailed market statistics
  - `GET /crypto/market` - Global cryptocurrency market statistics
    - Total market cap, trading volume, and Bitcoin dominance
    - Market cap and volume change percentages
  - `GET /crypto/insights/btc-dominance` - Bitcoin market dominance data over time
    - Time period filtering (24h, 1w, 1m, 3m, 6m, 1y, all)
    - Historical dominance percentage data points
    - Real-time market share analysis
  - `GET /crypto/insights/fear-greed` - Crypto Fear & Greed Index
    - Current market sentiment with classification (Fear/Greed/Extreme)
    - Historical data points (now, yesterday, last week)
    - Market psychology indicators for trading decisions
  - `GET /crypto/insights/rainbow-chart/:coinId` - Rainbow Chart technical analysis
    - Price analysis data for Bitcoin and Ethereum
    - Historical price/time data points for technical indicators
    - Support for multiple cryptocurrency analysis
  - `GET /crypto/news` - Cryptocurrency news by type with pagination
    - News type filtering (handpicked, trending, latest, bullish, bearish)
    - Pagination support with configurable page and limit parameters
    - Rich article metadata including reactions, related coins, and content flags
    - Source attribution and publication timestamps

- **Stock Market API Integration**: Complete Yahoo Finance API coverage

  - `GET /quote/:symbols` - Real-time stock quotes for multiple symbols
  - `GET /history/:symbols` - Historical price data with configurable periods and intervals
  - `GET /info/:symbols` - Company profiles, fundamentals, and market data
  - `GET /financial/:symbol/:type` - Financial statements (income, balance sheet, cash flow)
  - `GET /news/:symbol` - Company news and market context
  - `GET /search/:query` - Symbol and news search functionality
  - `GET /trending/:region` - Trending symbols by geographic region
  - `GET /recommendations/:symbol` - Similar stock recommendations
  - `GET /insights/:symbol` - Comprehensive stock analysis and insights
  - `GET /screener/:type` - Stock screening (gainers, losers, most active, most shorted)
  - `GET /market/sentiment` - Market sentiment with Fear & Greed Index
  - `GET /news_reader/*` - Full article content extraction from Yahoo Finance URLs

- **Model Context Protocol (MCP) Integration**: Official MCP SDK implementation for LLM integration

  - 5 comprehensive financial tools for AI assistants
  - Full MCP 2024-11-05 protocol compliance
  - Tools for quotes, history, news, financial statements, and cryptocurrency data
  - SSE streaming support for real-time data delivery

- **Advanced Caching System**: Multi-tier caching for optimal performance

  - Configurable TTL settings (short: 10s for real-time data, standard: 5min)
  - Per-symbol caching strategy to maximize hit rates
  - Support for NodeCache, Memcached, and Redis backends
  - Intelligent cache key management and invalidation

- **Production-Ready Infrastructure**:

  - Express.js server with TypeScript for type safety
  - Comprehensive error handling and validation
  - Rate limiting and CORS support for web applications
  - Docker containerization with multi-stage builds
  - Health checks and graceful shutdown
  - Environment-based configuration management

- **Developer Experience**:

  - Complete OpenAPI/Swagger documentation for all endpoints
  - Comprehensive Jest test suite (173 tests across 20 test suites)
  - ESLint configuration with strict TypeScript rules
  - Hot-reload development server with tsx
  - Example client scripts for OpenAI integration
  - Detailed README with setup, API usage, and deployment guides

- **Security & Reliability**:
  - Input validation and sanitization
  - Rate limiting to prevent abuse
  - Comprehensive logging with configurable levels
  - Graceful error handling with partial failure support
  - Environment variable management for sensitive configuration

### Technical Details

- **Runtime**: Node.js 22 with ES modules and TypeScript
- **Framework**: Express.js with comprehensive middleware stack
- **APIs**: yahoo-finance2 v3, CoinStats API, Alternative.me Fear & Greed Index
- **MCP**: @modelcontextprotocol/sdk v1.23.0 with Zod schema validation
- **Caching**: NodeCache with extensible backend support
- **Testing**: Jest with 100% route coverage and integration tests
- **Documentation**: OpenAPI 3.0 specifications with Swagger UI
- **Container**: Docker multi-stage build with health checks
- **CI/CD**: GitHub Actions pipeline for automated testing and deployment

### Features

- **Multi-Asset Support**: Stocks, ETFs, mutual funds, cryptocurrencies, and market indices
- **Real-Time Data**: Live quotes, prices, and market sentiment
- **Historical Analysis**: Flexible period and interval configurations
- **Advanced Filtering**: Sorting, pagination, and currency conversion
- **AI Integration**: Native MCP support for LLM applications
- **Web Ready**: CORS-enabled for direct browser integration
- **Enterprise Features**: Rate limiting, caching, and comprehensive logging

### Migration Notes

- **New Project**: This is the initial release - no migration required
- **API Keys**: Configure `COINSTATS_API_KEY` environment variable for cryptocurrency features
- **Environment Setup**: Copy `.env.example` to `.env` and configure as needed
- **Docker Deployment**: Use provided Docker Compose configuration for containerized deployment

### Added

- **Initial Release**: Complete financial data hub with comprehensive stock and cryptocurrency APIs

- **Cryptocurrency API Integration**: Full CoinStats API support for real-time cryptocurrency data

  - `GET /crypto/coins` - Retrieve cryptocurrency listings with advanced filtering and sorting
    - Support for limit, offset, currency, orderBy, and orderDirection parameters
    - Real-time price data, market cap, volume, and price changes
    - Multiple currency support (USD, EUR, BTC, ETH)
    - Sorting by market cap, price, volume, and price changes
  - `GET /crypto/coins/:coinId` - Detailed information for specific cryptocurrencies
    - Comprehensive coin data including price history, market metrics, and metadata
    - Support for multiple currencies and detailed market statistics

- **Stock Market API Integration**: Complete Yahoo Finance API coverage

  - `GET /quote/:symbols` - Real-time stock quotes for multiple symbols
  - `GET /history/:symbols` - Historical price data with configurable periods and intervals
  - `GET /info/:symbols` - Company profiles, fundamentals, and market data
  - `GET /financial/:symbol/:type` - Financial statements (income, balance sheet, cash flow)
  - `GET /news/:symbol` - Company news and market context
  - `GET /search/:query` - Symbol and news search functionality
  - `GET /trending/:region` - Trending symbols by geographic region
  - `GET /recommendations/:symbol` - Similar stock recommendations
  - `GET /insights/:symbol` - Comprehensive stock analysis and insights
  - `GET /screener/:type` - Stock screening (gainers, losers, most active, most shorted)
  - `GET /market/sentiment` - Market sentiment with Fear & Greed Index
  - `GET /news_reader/*` - Full article content extraction from Yahoo Finance URLs

- **Model Context Protocol (MCP) Integration**: Official MCP SDK implementation for LLM integration

  - 5 comprehensive financial tools for AI assistants
  - Full MCP 2024-11-05 protocol compliance
  - Tools for quotes, history, news, financial statements, and cryptocurrency data
  - SSE streaming support for real-time data delivery

- **Advanced Caching System**: Multi-tier caching for optimal performance

  - Configurable TTL settings (short: 10s for real-time data, standard: 5min)
  - Per-symbol caching strategy to maximize hit rates
  - Support for NodeCache, Memcached, and Redis backends
  - Intelligent cache key management and invalidation

- **Production-Ready Infrastructure**:

  - Express.js server with TypeScript for type safety
  - Comprehensive error handling and validation
  - Rate limiting and CORS support for web applications
  - Docker containerization with multi-stage builds
  - Health checks and graceful shutdown
  - Environment-based configuration management

- **Developer Experience**:

  - Complete OpenAPI/Swagger documentation for all endpoints
  - Comprehensive Jest test suite (173 tests across 20 test suites)
  - ESLint configuration with strict TypeScript rules
  - Hot-reload development server with tsx
  - Example client scripts for OpenAI integration
  - Detailed README with setup, API usage, and deployment guides

- **Security & Reliability**:
  - Input validation and sanitization
  - Rate limiting to prevent abuse
  - Comprehensive logging with configurable levels
  - Graceful error handling with partial failure support
  - Environment variable management for sensitive configuration

### Technical Details

- **Runtime**: Node.js 22 with ES modules and TypeScript
- **Framework**: Express.js with comprehensive middleware stack
- **APIs**: yahoo-finance2 v3, CoinStats API, Alternative.me Fear & Greed Index
- **MCP**: @modelcontextprotocol/sdk v1.23.0 with Zod schema validation
- **Caching**: NodeCache with extensible backend support
- **Testing**: Jest with 100% route coverage and integration tests
- **Documentation**: OpenAPI 3.0 specifications with Swagger UI
- **Container**: Docker multi-stage build with health checks
- **CI/CD**: GitHub Actions pipeline for automated testing and deployment

### Features

- **Multi-Asset Support**: Stocks, ETFs, mutual funds, cryptocurrencies, and market indices
- **Real-Time Data**: Live quotes, prices, and market sentiment
- **Historical Analysis**: Flexible period and interval configurations
- **Advanced Filtering**: Sorting, pagination, and currency conversion
- **AI Integration**: Native MCP support for LLM applications
- **Web Ready**: CORS-enabled for direct browser integration
- **Enterprise Features**: Rate limiting, caching, and comprehensive logging

### Migration Notes

- **New Project**: This is the initial release - no migration required
- **API Keys**: Configure `COINSTATS_API_KEY` environment variable for cryptocurrency features
- **Environment Setup**: Copy `.env.example` to `.env` and configure as needed
- **Docker Deployment**: Use provided Docker Compose configuration for containerized deployment
