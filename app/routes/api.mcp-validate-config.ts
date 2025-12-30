import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import { MCPService } from '~/lib/services/mcpService';

const logger = createScopedLogger('api.mcp-validate-config');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { serverName, config } = (await request.json()) as { serverName: string; config: any };

    if (!serverName) {
      return Response.json({ error: 'Server name is required' }, { status: 400 });
    }

    if (!config) {
      return Response.json({ error: 'Configuration is required' }, { status: 400 });
    }

    const mcpService = MCPService.getInstance();
    const result = mcpService.validateServerConfig(serverName, config);

    return Response.json(result);
  } catch (error) {
    logger.error('Error validating MCP server config:', error);
    return Response.json({ error: 'Failed to validate MCP server configuration' }, { status: 500 });
  }
}
