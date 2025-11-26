import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import { MCPService } from '~/lib/services/mcpService';

const logger = createScopedLogger('api.mcp-retry');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { serverName } = (await request.json()) as { serverName: string };

    if (!serverName) {
      return Response.json({ error: 'Server name is required' }, { status: 400 });
    }

    const mcpService = MCPService.getInstance();
    const serverTools = await mcpService.checkServersAvailabilities();

    const serverStatus = serverTools[serverName];

    if (!serverStatus) {
      return Response.json({ error: `Server "${serverName}" not found in configuration` }, { status: 404 });
    }

    return Response.json({
      serverName,
      status: serverStatus.status,
      server: serverStatus,
    });
  } catch (error) {
    logger.error('Error retrying MCP server connection:', error);
    return Response.json({ error: 'Failed to retry server connection' }, { status: 500 });
  }
}
