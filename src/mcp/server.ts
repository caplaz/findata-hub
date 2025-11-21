/**
 * MCP (Model Context Protocol) Server Implementation
 * Uses official @modelcontextprotocol/sdk schemas with Express HTTP + SSE
 *
 * Provides financial data tools to LLM models with:
 * - MCP-compliant tool definitions and schemas
 * - HTTP endpoints for tool discovery and execution
 * - Server-Sent Events (SSE) for streaming responses
 * - Error handling and validation
 *
 * @module mcp/server
 */

import router from "./endpoints";

export default router;
