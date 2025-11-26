import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import { MCPService, type MCPServerConfig } from '~/lib/services/mcpService';

const logger = createScopedLogger('api.mcp-validate-config');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { serverName, config } = (await request.json()) as {
      serverName: string;
      config: MCPServerConfig;
    };

    if (!serverName || !config) {
      return Response.json({ error: 'Server name and config are required' }, { status: 400 });
    }

    const mcpService = MCPService.getInstance();
    const validation = mcpService.validateServerConfig(serverName, config);

    if (!validation.isValid) {
      return Response.json(
        {
          isValid: false,
          error: validation.error,
        },
        { status: 400 },
      );
    }

    return Response.json({
      isValid: true,
      config: validation.config,
    });
  } catch (error) {
    logger.error('Error validating MCP server config:', error);
    return Response.json({ error: 'Failed to validate server configuration' }, { status: 500 });
  }
}
