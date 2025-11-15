# Yahoo Finance Server

A Node.js Express API server that serves Yahoo Finance data using the yahoo-finance2 library. Supports multiple tickers in a single request with arrays as results, including partial failure handling.

## Features

- Express API with configurable rate limiting and caching
- Multi-ticker support for all endpoints
- Docker multi-stage build
- Health checks
- Proper error handling
- Jest tests

## Endpoints

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

**Example:**

```bash
curl http://localhost:3000/health
```

### GET /quote/:symbols

Get current stock prices. Supports multiple symbols separated by commas.

**Parameters:**

- `symbols`: Stock symbols (e.g., AAPL,GOOGL)

**Response:** Array of quote objects or null for invalid symbols.

**Example:**

```bash
curl http://localhost:3000/quote/AAPL
curl http://localhost:3000/quote/AAPL,GOOGL
```

### GET /history/:symbols

Get historical price data. Supports multiple symbols.

**Parameters:**

- `symbols`: Stock symbols
- `period` (optional): Time period (default: 1y)
- `interval` (optional): Data interval (default: 1d)

**Response:** Array of historical data arrays or null for failures.

**Example:**

```bash
curl "http://localhost:3000/history/AAPL?period=1y&interval=1d"
curl "http://localhost:3000/history/AAPL,TSLA?period=6mo&interval=1wk"
```

### GET /info/:symbols

Get company information. Supports multiple symbols.

**Parameters:**

- `symbols`: Stock symbols

**Response:** Array of info objects or null for failures.

**Example:**

```bash
curl http://localhost:3000/info/MSFT
curl http://localhost:3000/info/AAPL,GOOGL
```

## Setup

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Run in development mode:

```bash
npm run dev
```

3. Run tests:

```bash
npm test
```

### Docker

1. Build and run with Docker Compose:

```bash
docker-compose up --build
```

The server will be available at http://localhost:3000.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000, i.e., 15 minutes)
- `RATE_LIMIT_MAX`: Maximum requests per window per IP (default: 100)
- `CACHE_ENABLED`: Enable caching (default: true, set to 'false' to disable)
- `CACHE_TTL`: Cache TTL in seconds (default: 300, i.e., 5 minutes)

## Rate Limiting

Requests are limited to prevent abuse. Defaults to 100 requests per 15 minutes per IP address. Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` environment variables.

## Caching

API responses are cached in memory to reduce external API calls. Defaults to 5 minutes TTL. Configurable via `CACHE_ENABLED` and `CACHE_TTL` environment variables.

## Error Handling

- Invalid symbols return null in arrays for multi-ticker requests.
- API errors return 500 with error message.
- Unknown routes return 404.

## License

Apache-2.0
