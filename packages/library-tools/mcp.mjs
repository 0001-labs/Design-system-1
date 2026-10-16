#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { LibraryClient } from './client.mjs';

const client = new LibraryClient();
const server = new Server({ name: 'design-system-1-libraries', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const { operations } = await client.schema();
  return { tools: operations.map(op => ({ name: `libraries_${op.name}`, description: op.description, inputSchema: op.inputSchema, annotations: { readOnlyHint: op.readOnly, destructiveHint: !op.readOnly, openWorldHint: true } })) };
});
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  try {
    if (!params.name.startsWith('libraries_')) throw new Error('Unknown tool.');
    const result = await client.call(params.name.slice('libraries_'.length), params.arguments ?? {});
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: error.code ?? 'request_failed', message: error.message, details: error.details }) }] };
  }
});
await server.connect(new StdioServerTransport());
