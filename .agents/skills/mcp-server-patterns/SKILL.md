---
name: mcp-server-patterns
description: Build MCP servers with Node/TypeScript SDK — tools, resources, prompts, Zod validation, stdio vs Streamable HTTP.
origin: ECC
---

# MCP Server Patterns

Build MCP servers for ONYX agent tools.

## When to Use

- Implementing a new MCP server for ONYX tooling
- Adding tools or resources to existing servers
- Choosing stdio vs HTTP transport
- Debugging MCP registration issues

## Core Concepts

- **Tools**: Actions the model can invoke (e.g., runIntel, searchMem, navigate)
- **Resources**: Read-only data the model can fetch (crystal list, scene JSON)
- **Prompts**: Reusable parameterised prompt templates

## Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

const server = new McpServer({ name: "onyx-intel-mcp", version: "0.1.0" })

server.tool(
  "run_intel",
  "Run multi-source intelligence brief on a topic",
  { topic: z.string().min(3) },
  async ({ topic }) => {
    const brief = await runIntel(topic)
    return { content: [{ type: "text", text: JSON.stringify(brief) }] }
  }
)
```

## Transport: stdio (local)

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
const transport = new StdioServerTransport()
await server.connect(transport)
```

## Transport: Streamable HTTP (remote)

Use for Cursor, cloud, or other remote clients. Single MCP HTTP endpoint per current spec.

## Best Practices

- Schema first: define Zod schemas for every tool input
- Return structured errors the model can interpret
- Prefer idempotent tools where possible
- Rate-limit tools that call external APIs
- Document cost in tool description