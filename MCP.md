/\*\*

- MCP (Model Context Protocol) Integration Guide
-
- This document describes the MCP server implementation for the Yahoo Finance API,
- providing LLM-friendly tool access via HTTP + Server-Sent Events (SSE).
  \*/

# MCP Server Overview

The MCP server extends the Yahoo Finance API with a protocol-compliant interface optimized for Large Language Models (LLMs). It provides:

- **11 Financial Data Tools**: Stock quotes, history, company info, search, trending, recommendations, insights, screeners, performance analysis, financial statements, and news
- **HTTP-based Access**: RESTful endpoints for tool discovery and execution
- **Server-Sent Events (SSE)**: Streaming responses for long-running operations
- **MCP Compliance**: Schema definitions compatible with MCP clients

## Architecture

```
Express Server (Port 3000)
├── /api/*                     [Financial API endpoints]
├── /api-docs                  [Swagger UI documentation]
└── /mcp/*                     [MCP endpoints]
    ├── GET  /health          [Server health & tools info]
    ├── GET  /tools           [List available tools with schemas]
    ├── POST /call            [Execute tool (JSON response)]
    └── POST /call-stream     [Execute tool (SSE streaming)]
```

## MCP Endpoints

### 1. Health Check

**GET** `/mcp/health`

Returns MCP server status, version, and available tools.

**Response:**

```json
{
  "status": "healthy",
  "service": "MCP Server",
  "version": "1.0.0",
  "toolsAvailable": 9,
  "tools": ["get_stock_quote", "get_stock_history", ...],
  "features": ["json-response", "sse-streaming"],
  "timestamp": "2025-11-16T04:43:25.528Z"
}
```

### 2. List Tools

**GET** `/mcp/tools`

Returns all available MCP tools with their descriptions and input schemas.

**Response:**

```json
{
  "tools": [
    {
      "name": "get_stock_quote",
      "description": "Get current stock quotes...",
      "inputSchema": {
        "type": "object",
        "properties": { "symbols": { "type": "string" } },
        "required": ["symbols"]
      }
    },
    ...
  ]
}
```

### 3. Execute Tool (JSON)

**POST** `/mcp/call`

Execute a tool and receive the complete response as JSON.

**Request:**

```json
{
  "name": "get_stock_quote",
  "arguments": {
    "symbols": "AAPL"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{...result data...}"
    }
  ]
}
```

### 4. Execute Tool (SSE Streaming)

**POST** `/mcp/call-stream`

Execute a tool and stream the results as Server-Sent Events.

**Request:**

```json
{
  "name": "search_symbols",
  "arguments": {
    "query": "apple"
  }
}
```

**Response Stream:**

```
event: event_start
data: {"tool":"search_symbols","timestamp":"...","message":"Executing MCP tool: search_symbols"}

event: event_arguments
data: {"tool":"search_symbols","arguments":{"query":"apple"},"timestamp":"..."}

event: event_processing
data: {"tool":"search_symbols","status":"in_progress","message":"Fetching data from Yahoo Finance...","timestamp":"..."}

event: event_data
data: {"tool":"search_symbols","result":{...full result...},"resultType":"object","timestamp":"..."}

event: event_complete
data: {"tool":"search_symbols","status":"success","timestamp":"...","message":"Tool 'search_symbols' completed successfully"}
```

## Available Tools

### 1. `get_stock_quote`

Get current stock quotes for one or more ticker symbols.

**Arguments:**

- `symbols` (string, required): Comma-separated list of stock ticker symbols (e.g., 'AAPL,GOOGL,MSFT')

**Returns:** Array of quote objects with price, currency, market cap, P/E ratio, dividend, 52-week high/low, and average volume.

### 2. `get_stock_history`

Get historical price data for a stock symbol.

**Arguments:**

- `symbols` (string, required): Stock ticker symbols
- `period` (string): Time period (default: '1y'). Options: '1d', '5d', '1wk', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'max'
- `interval` (string): Data interval (default: '1d'). Options: '1m', '5m', '15m', '30m', '60m', '1d', '1wk', '1mo'

**Returns:** Historical price data with latest close, highest/lowest prices, and OHLCV data points.

### 3. `get_company_info`

Get comprehensive company information.

**Arguments:**

- `symbols` (string, required): Stock ticker symbols

**Returns:** Company details including industry, sector, website, business summary, employees, revenue per share, and margins.

### 4. `search_symbols`

Search for stocks, ETFs, and indices by company name, symbol, or keyword.

**Arguments:**

- `query` (string, required): Search query

**Returns:** Up to 10 matching results with symbol, name, type, and exchange information.

### 5. `get_trending_symbols`

Get trending/most watched stocks by region.

**Arguments:**

- `region` (string): Region code (default: 'US'). Options: 'US', 'GB', 'AU', 'CA', 'FR', 'DE', 'HK', 'SG', 'IN'

**Returns:** List of trending symbols with current prices and percentage changes.

### 6. `get_stock_recommendations`

Get similar stock recommendations based on a stock symbol.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol

**Returns:** Recommended stocks with recommendation scores and analyst rating percentages.

### 7. `get_stock_insights`

Get comprehensive stock insights including analyst recommendations, insider activity, and research.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol

**Returns:** Recommendation trends, insider transactions, insider holders, and analyst upgrades/downgrades.

### 8. `get_stock_screener`

Get lists of stocks by specific criteria.

**Arguments:**

- `type` (string, required): Screener type. Options: 'day_gainers', 'day_losers', 'most_actives', 'most_shorted', 'growth_tech_stocks', 'day_gainers_etf', 'day_losers_etf'
- `count` (integer): Number of results (default: 25, max: 100)

**Returns:** Lists of stocks matching the screener criteria with prices, changes, volume, and market cap.

### 9. `analyze_stock_performance`

Analyze stock performance over a time period.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol
- `period` (string): Analysis period (default: '1y'). Options: '1d', '5d', '1wk', '1mo', '3mo', '6mo', '1y', 'max'

**Returns:** Performance metrics including current price, period returns, volatility, trend direction, and historical highs/lows.

### 10. `get_financial_statement`

Get comprehensive financial statements including income statement, balance sheet, or cash flow statement.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol
- `statementType` (string, required): Type of statement. Options: 'income', 'balance', 'cashflow'
- `period` (string): Statement period (default: 'annual'). Options: 'annual', 'quarterly'

**Returns:** Financial statement data with key metrics:

- **Income Statement**: Revenue, gross profit, operating income, net income, diluted EPS
- **Balance Sheet**: Total assets, liabilities, equity, cash, current assets/liabilities
- **Cash Flow**: Operating cash flow, investing flow, financing flow, free cash flow

### 11. `get_stock_news`

Get latest news articles and headlines for a stock.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol
- `count` (number): Number of articles to return (default: 10, max: 50)

**Returns:** News articles with title, description, source, published date, and thumbnail.

## Usage Examples

### Using curl for JSON Response

```bash
# Search for stocks
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search_symbols",
    "arguments": {"query": "apple"}
  }'

# Get stock quotes
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_stock_quote",
    "arguments": {"symbols": "AAPL,MSFT"}
  }'

# Get financial statement
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_financial_statement",
    "arguments": {"symbol": "AAPL", "statementType": "income", "period": "annual"}
  }'

# Get latest news
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_stock_news",
    "arguments": {"symbol": "MSFT", "count": 5}
  }'
```

### Using curl for SSE Streaming

```bash
# Stream trending symbols
curl -X POST http://localhost:3000/mcp/call-stream \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_trending_symbols",
    "arguments": {"region": "US"}
  }'
```

### Using JavaScript/TypeScript

```javascript
// JSON response
const response = await fetch("http://localhost:3000/mcp/call", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "get_stock_quote",
    arguments: { symbols: "AAPL" },
  }),
});
const data = await response.json();
console.log(data.content[0].text);

// SSE Streaming
const eventSource = new EventSource("http://localhost:3000/mcp/call-stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "search_symbols",
    arguments: { query: "microsoft" },
  }),
});

eventSource.addEventListener("event_start", (e) => {
  console.log("Started:", JSON.parse(e.data));
});

eventSource.addEventListener("event_data", (e) => {
  console.log("Data:", JSON.parse(e.data).result);
});

eventSource.addEventListener("event_complete", (e) => {
  console.log("Done:", JSON.parse(e.data));
  eventSource.close();
});
```

### Using Python

```python
import requests
import json

# JSON response
response = requests.post(
    'http://localhost:3000/mcp/call',
    json={
        'name': 'get_stock_quote',
        'arguments': {'symbols': 'AAPL'}
    }
)
print(response.json())

# SSE Streaming
response = requests.post(
    'http://localhost:3000/mcp/call-stream',
    json={
        'name': 'search_symbols',
        'arguments': {'query': 'apple'}
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode())
```

## Error Handling

When a tool execution fails, the response will include an error message:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error executing tool 'get_stock_quote': Invalid symbol",
      "isError": true
    }
  ]
}
```

For SSE streams, an error event is sent:

```
event: event_error
data: {"tool":"get_stock_quote","status":"error","error":"Invalid symbol","timestamp":"..."}
```

## Integration with LLM Systems

The MCP server is designed to work seamlessly with LLM systems:

1. **Tool Discovery**: LLMs call `/mcp/tools` to discover available tools and their schemas
2. **Parameter Validation**: JSON schemas are used to validate arguments before execution
3. **Streaming Support**: Long operations use SSE for progressive feedback to the LLM
4. **Error Propagation**: Tool errors are properly formatted for LLM error handling

### Example: Claude with MCP

```python
from anthropic import Anthropic
import requests
import json

client = Anthropic()

def get_mcp_tools():
    """Fetch available MCP tools"""
    response = requests.get('http://localhost:3000/mcp/tools')
    return response.json()['tools']

def call_mcp_tool(tool_name, arguments):
    """Execute an MCP tool"""
    response = requests.post(
        'http://localhost:3000/mcp/call',
        json={'name': tool_name, 'arguments': arguments}
    )
    return response.json()['content'][0]['text']

# Get available tools
tools = get_mcp_tools()

# Use with Claude
conversation_history = []

while True:
    user_input = input("You: ")
    conversation_history.append({"role": "user", "content": user_input})

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        tools=tools,
        messages=conversation_history
    )

    # Handle tool use
    if response.stop_reason == "tool_use":
        for block in response.content:
            if block.type == "tool_use":
                result = call_mcp_tool(block.name, block.input)
                conversation_history.append({
                    "role": "user",
                    "content": [
                        {"type": "tool_result", "tool_use_id": block.id, "content": result}
                    ]
                })

    # Print response
    for block in response.content:
        if hasattr(block, 'text'):
            print(f"Claude: {block.text}")
```

## Performance Considerations

- **Caching**: The main API endpoints cache responses (300s TTL by default)
- **Rate Limiting**: 100 requests per 15 minutes per IP address
- **Timeouts**: Yahoo Finance API calls may take 1-3 seconds
- **Streaming**: Use SSE for operations that might take > 2 seconds

## Deployment

The MCP server is automatically started when the main server runs:

```bash
npm start
```

MCP endpoints are available at:

```
http://localhost:3000/mcp/
```

For production deployment with custom domains:

```bash
SWAGGER_SERVER_URL=https://api.example.com npm start
```

The MCP endpoints will be available at:

```
https://api.example.com/mcp/
```
