import { createServer } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./server.js";

/**
 * brandrail-mcp            → stdio transport (Claude Desktop / Claude Code)
 * brandrail-mcp --http [p] → streamable HTTP (SSE) on localhost:p (default 3845)
 */
const args = process.argv.slice(2);

if (args.includes("--http") || args.includes("--sse")) {
  const flag = args.includes("--http") ? "--http" : "--sse";
  const portArg = args[args.indexOf(flag) + 1];
  const port = portArg && /^\d+$/.test(portArg) ? Number(portArg) : 3845;
  createServer(async (req, res) => {
    // stateless mode: a fresh server+transport pair per request
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => {
      void transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    });
  }).listen(port, "127.0.0.1", () => {
    console.error(`brandrail mcp listening on http://127.0.0.1:${port}`);
  });
} else {
  const server = buildServer();
  await server.connect(new StdioServerTransport());
}
