
import OpenAI from "openai";

// Configuration
const MCP_SERVER_URL = "http://localhost:3000/mcp";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure this is set

if (!OPENAI_API_KEY) {
    console.error("Please set OPENAI_API_KEY environment variable");
    process.exit(1);
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Fetch available tools from MCP server in OpenAI format
 */
async function getMcpTools() {
    try {
        const response = await fetch(`${MCP_SERVER_URL}/tools?format=openai`);
        if (!response.ok) {
            throw new Error(`Failed to fetch tools: ${response.statusText}`);
        }
        const data = await response.json();
        return data.tools;
    } catch (error) {
        console.error("Error fetching MCP tools:", error);
        process.exit(1);
    }
}

/**
 * Execute a tool call against the MCP server
 */
async function executeToolCall(toolCall) {
    const { name, arguments: argsString } = toolCall.function;
    const args = JSON.parse(argsString);

    console.log(`Executing tool: ${name} with args:`, args);

    try {
        const response = await fetch(`${MCP_SERVER_URL}/call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                arguments: args,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tool execution failed: ${response.statusText}`);
        }

        const data = await response.json();
        // MCP returns { content: [{ type: 'text', text: '...' }] }
        // We need to return a string to OpenAI
        return data.content[0].text;
    } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return JSON.stringify({ error: error.message });
    }
}

/**
 * Main chat loop
 */
async function main() {
    // 1. Get tools
    const tools = await getMcpTools();
    console.log(`Loaded ${tools.length} tools from MCP server`);

    // 2. Start conversation
    const messages = [
        { role: "system", content: "You are a helpful financial assistant." },
        { role: "user", content: "What are the top holdings of SPY ETF?" },
    ];

    console.log("\nUser:", messages[messages.length - 1].content);

    // 3. Call OpenAI
    const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools,
        tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // 4. Handle tool calls
    if (responseMessage.tool_calls) {
        messages.push(responseMessage); // Add assistant's message with tool calls

        for (const toolCall of responseMessage.tool_calls) {
            const toolResult = await executeToolCall(toolCall);

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolResult,
            });
        }

        // 5. Get final response
        const finalResponse = await client.chat.completions.create({
            model: "gpt-4o",
            messages,
        });

        console.log("\nAssistant:", finalResponse.choices[0].message.content);
    } else {
        console.log("\nAssistant:", responseMessage.content);
    }
}

main().catch(console.error);
