/**
 * MCP HTTP API Endpoints
 * Express routes for MCP server with tool discovery and execution
 *
 * @module mcp/endpoints
 */

import express, { Request, Response } from "express";

import { log } from "../utils/logger";

import { toolHandlers } from "./handlers";
import { tools } from "./tools";

const router = express.Router();

// ============================================================================
// MCP HTTP API Endpoints
// ============================================================================

/**
 * List Tools Endpoint
 * GET /mcp/tools
 * Returns all available MCP tools with their schemas
 */
router.get("/tools", (req: Request, res: Response) => {
  const format = req.query.format;
  log("info", `MCP: Tools list requested (format: ${format || "standard"})`);

  if (format === "openai") {
    const openAiTools = tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
    return res.json({ tools: openAiTools });
  }

  res.json({
    tools,
  });
});

/**
 * Call Tool Endpoint (JSON Response)
 * POST /mcp/call
 * Executes a tool with provided arguments and returns JSON response
 *
 * Request body:
 * {
 *   "name": "tool_name",
 *   "arguments": { ...tool arguments... }
 * }
 */
router.post("/call", async (req: Request, res: Response) => {
  const { name, arguments: args } = req.body;

  if (!name || !args) {
    return res.status(400).json({
      error: "Missing required fields: name and arguments",
    });
  }

  if (!toolHandlers[name]) {
    return res.status(404).json({
      error: `Unknown tool: ${name}`,
      availableTools: Object.keys(toolHandlers),
    });
  }

  try {
    log("info", `MCP: Executing tool '${name}'`, args);

    const handler = toolHandlers[name];
    const result = await handler(...Object.values(args));

    res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    });
  } catch (error) {
    log("error", `MCP: Tool execution error for '${name}':`, error);
    res.status(500).json({
      content: [
        {
          type: "text",
          text: `Error executing tool '${name}': ${error.message}`,
          isError: true,
        },
      ],
    });
  }
});

/**
 * Call Tool Endpoint (SSE Streaming)
 * POST /mcp/call-stream
 * Executes a tool and streams the execution progress via Server-Sent Events
 *
 * Request body:
 * {
 *   "name": "tool_name",
 *   "arguments": { ...tool arguments... }
 * }
 *
 * Response: Streams multiple SSE events
 * - event_start: Tool execution started
 * - event_arguments: Arguments received and validated
 * - event_processing: Processing is underway
 * - event_data: Result data chunk
 * - event_complete: Execution completed
 * - event_error: Error occurred
 */
router.post("/call-stream", async (req: Request, res: Response) => {
  const { name, arguments: args } = req.body;

  if (!name || !args) {
    res.status(400).json({
      error: "Missing required fields: name and arguments",
    });
    return;
  }

  if (!toolHandlers[name]) {
    res.status(404).json({
      error: `Unknown tool: ${name}`,
      availableTools: Object.keys(toolHandlers),
    });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    log("info", `MCP: SSE Stream started for tool '${name}'`);

    // Send start event
    sendSSEEvent(res, "event_start", {
      tool: name,
      timestamp: new Date().toISOString(),
      message: `Executing MCP tool: ${name}`,
    });

    // Send arguments event
    sendSSEEvent(res, "event_arguments", {
      tool: name,
      arguments: args,
      timestamp: new Date().toISOString(),
    });

    // Send processing event
    sendSSEEvent(res, "event_processing", {
      tool: name,
      status: "in_progress",
      message: "Fetching data from Yahoo Finance...",
      timestamp: new Date().toISOString(),
    });

    // Execute the tool
    const handler = toolHandlers[name];
    const result = await handler(...Object.values(args));

    // Send data event with result
    sendSSEEvent(res, "event_data", {
      tool: name,
      result,
      resultType: typeof result,
      timestamp: new Date().toISOString(),
    });

    // Send completion event
    sendSSEEvent(res, "event_complete", {
      tool: name,
      status: "success",
      timestamp: new Date().toISOString(),
      message: `Tool '${name}' completed successfully`,
    });

    res.write(":\n\n"); // keepalive
    res.end();

    log("info", `MCP: SSE Stream completed for tool '${name}'`);
  } catch (error) {
    log("error", `MCP: Stream error for tool '${name}':`, error);

    // Send error event
    sendSSEEvent(res, "event_error", {
      tool: name,
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Send completion event
    sendSSEEvent(res, "event_complete", {
      tool: name,
      status: "error",
      timestamp: new Date().toISOString(),
      message: `Tool '${name}' failed`,
    });

    res.write(":\n\n"); // keepalive
    res.end();
  }
});

/**
 * MCP Health Check Endpoint
 * GET /mcp/health
 * Returns server status and available tools
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "MCP Server",
    version: "1.0.0",
    toolsAvailable: tools.length,
    tools: tools.map((t) => t.name),
    features: ["json-response", "sse-streaming"],
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * tags:
 *   - name: MCP
 *     description: Model Context Protocol endpoints for LLM integration
 */

/**
 * @swagger
 * /mcp/health:
 *   get:
 *     summary: MCP server health check
 *     description: Returns MCP server status and available tools
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: MCP server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 service:
 *                   type: string
 *                   example: "MCP Server"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 toolsAvailable:
 *                   type: integer
 *                   example: 14
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["get_stock_quote", "get_stock_history"]
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["json-response", "sse-streaming"]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /mcp/tools:
 *   get:
 *     summary: List all available MCP tools
 *     description: Returns all available MCP tools with their schemas and descriptions
 *     tags: [MCP]
 *     parameters:
 *       - in: query
 *         name: format
 *         description: Response format
 *         schema:
 *           type: string
 *           enum: [standard, openai]
 *           default: standard
 *         example: "standard"
 *     responses:
 *       200:
 *         description: List of MCP tools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "get_stock_quote"
 *                       description:
 *                         type: string
 *                         example: "Get current stock quotes for one or more ticker symbols"
 *                       inputSchema:
 *                         type: object
 *                         description: JSON schema for tool input parameters
 */

/**
 * @swagger
 * /mcp/call:
 *   post:
 *     summary: Execute MCP tool (JSON response)
 *     description: Executes an MCP tool with provided arguments and returns JSON response
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tool name to execute
 *                 example: "get_stock_quote"
 *               arguments:
 *                 type: object
 *                 description: Tool arguments
 *                 example: {"symbols": "AAPL,GOOGL"}
 *             required:
 *               - name
 *               - arguments
 *     responses:
 *       200:
 *         description: Tool execution successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "text"
 *                       text:
 *                         type: string
 *                         description: Tool execution result as JSON string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Unknown tool
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Tool execution error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /mcp/call-stream:
 *   post:
 *     summary: Execute MCP tool (SSE streaming)
 *     description: Executes an MCP tool and streams the execution progress via Server-Sent Events
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tool name to execute
 *                 example: "get_stock_quote"
 *               arguments:
 *                 type: object
 *                 description: Tool arguments
 *                 example: {"symbols": "AAPL,GOOGL"}
 *             required:
 *               - name
 *               - arguments
 *     responses:
 *       200:
 *         description: Tool execution streaming response
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream with execution progress
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Unknown tool
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Tool execution error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Send Server-Sent Event
 * Formats and sends SSE messages to client
 *
 * Format:
 * event: eventType\n
 * data: JSON.stringify(data)\n\n
 */
function sendSSEEvent(res: Response, eventType: string, data: unknown) {
  try {
    const eventLine = `event: ${eventType}\n`;
    const dataLine = `data: ${JSON.stringify(data)}\n\n`;
    res.write(eventLine + dataLine);
  } catch (error) {
    log("error", `Failed to send SSE event '${eventType}':`, error);
  }
}

export default router;
