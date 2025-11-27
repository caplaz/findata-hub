/\*\*

- MCP (Model Context Protocol) Integration Guide
-
- This document describes the MCP server implementation for the Yahoo Finance API,
- providing LLM-friendly tool access via HTTP + Server-Sent Events (SSE).
  \*/

# MCP Server Overview

The MCP server extends the Yahoo Finance API with a protocol-compliant interface optimized for Large Language Models (LLMs). It provides:

- **5 Aggregated Financial Data Tools**: Comprehensive tools that combine multiple data sources for better LLM integration
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
  "toolsAvailable": 5,
  "tools": ["get_stock_overview", "get_stock_analysis", "get_market_intelligence", "get_financial_deep_dive", "get_news_and_research"],
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

### 1. `get_stock_overview`

Get comprehensive stock overview combining current quotes, company information, and key financial metrics.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol (e.g., 'AAPL', 'GOOGL', 'MSFT')

**Returns:** Complete stock overview including:
- Current price, change, and market data
- Company information (name, industry, sector, website, business summary)
- Key financial metrics (P/E, dividend, market cap, beta, forward P/E)
- 52-week high/low and trading volume

### 2. `get_stock_analysis`

Get comprehensive stock analysis combining recommendations, insights, performance data, and optional news.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol
- `includeNews` (boolean): Whether to include latest news articles (default: true)
- `newsCount` (integer): Number of news articles to include (default: 5, max: 20)

**Returns:** Complete analysis including:
- Similar stock recommendations with scores
- Analyst insights (recommendation trends, insider activity, upgrades/downgrades)
- Performance analysis (1-year returns, volatility, trend direction)
- Latest news articles (if requested)

### 3. `get_market_intelligence`

Get market intelligence data including trending symbols, stock screeners, and symbol search.

**Arguments:**

- `action` (string, required): Type of market intelligence. Options: 'trending', 'screener', 'search'
- `region` (string): Region for trending data (default: 'US'). Options: 'US', 'GB', 'AU', 'CA', 'FR', 'DE', 'HK', 'SG', 'IN'
- `screenerType` (string): Screener type when action is 'screener'. Options: 'day_gainers', 'day_losers', 'most_actives', etc.
- `searchQuery` (string): Search query when action is 'search'
- `count` (integer): Number of results to return (default: 25, max: 100)

**Returns:** Market intelligence data based on action:
- **trending**: List of trending symbols with prices and changes
- **screener**: Stocks matching screener criteria with market data
- **search**: Search results with symbol, name, type, and exchange

### 4. `get_financial_deep_dive`

Get comprehensive financial data including statements and holdings information.

**Arguments:**

- `symbol` (string, required): Stock ticker symbol (works best with ETFs and mutual funds)

**Returns:** Financial deep dive including:
- Financial statements (income, balance sheet, cash flow) for last 3 years
- Holdings data for ETFs/mutual funds (top holdings, sector allocations, fund profile)
- Key financial metrics and ratios

### 5. `get_news_and_research`

Get news and research data including articles, article reading, and symbol search.

**Arguments:**

- `action` (string, required): Type of news/research action. Options: 'news', 'read', 'search'
- `symbol` (string): Stock ticker symbol (required for 'news' action)
- `query` (string): Search query (required for 'search' action)
- `url` (string): Full Yahoo Finance article URL (required for 'read' action)
- `count` (integer): Number of results (default: 10, max: 50)

**Returns:** News and research data based on action:
- **news**: Latest news articles for a stock symbol
- **read**: Full article content extracted from Yahoo Finance URL
- **search**: Symbol search results matching the query

## Usage Examples

### Using curl for JSON Response

```bash
# Get stock overview
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_stock_overview",
    "arguments": {"symbol": "AAPL"}
  }'

# Get comprehensive stock analysis
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_stock_analysis",
    "arguments": {"symbol": "AAPL", "includeNews": true}
  }'

# Get market intelligence (trending)
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_market_intelligence",
    "arguments": {"action": "trending", "region": "US"}
  }'

# Get financial deep dive
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_financial_deep_dive",
    "arguments": {"symbol": "SPY"}
  }'

# Get news and research
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_news_and_research",
    "arguments": {"action": "news", "symbol": "MSFT"}
  }'
```

### Using curl for SSE Streaming

```bash
# Stream market intelligence
curl -X POST http://localhost:3000/mcp/call-stream \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_market_intelligence",
    "arguments": {"action": "trending", "region": "US"}
  }'
```

### Using JavaScript/TypeScript

```javascript
// JSON response
const response = await fetch("http://localhost:3000/mcp/call", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "get_stock_overview",
    arguments: { symbol: "AAPL" },
  }),
});
const data = await response.json();
console.log(data.content[0].text);

// SSE Streaming
const eventSource = new EventSource("http://localhost:3000/mcp/call-stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "get_market_intelligence",
    arguments: { action: "search", searchQuery: "microsoft" },
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
        'name': 'get_stock_overview',
        'arguments': {'symbol': 'AAPL'}
    }
)
print(response.json())

# SSE Streaming
response = requests.post(
    'http://localhost:3000/mcp/call-stream',
    json={
        'name': 'get_market_intelligence',
        'arguments': {'action': 'search', 'searchQuery': 'apple'}
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
