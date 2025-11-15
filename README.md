# Yahoo Finance Server

A Node.js Express API server that serves Yahoo Finance data using the yahoo-finance2 library. Supports multiple tickers in a single request with arrays as results, including partial failure handling.

## Features

- Express API with rate limiting (100 requests per 15 minutes per IP)
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

## Rate Limiting

Requests are limited to 100 per 15 minutes per IP address to prevent abuse.

## Error Handling

- Invalid symbols return null in arrays for multi-ticker requests.
- API errors return 500 with error message.
- Unknown routes return 404.

## License

Apache-2.0
