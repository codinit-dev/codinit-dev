import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MCPService, type MCPServerConfig } from '~/lib/services/mcpService';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { serverName, config } = (await request.json()) as {
      serverName: string;
      config: MCPServerConfig;
    };

    if (!serverName || !config) {
      return Response.json({ error: 'Missing serverName or config' }, { status: 400 });
    }

    const mcpService = MCPService.getInstance();
    const validation = mcpService.validateServerConfig(serverName, config);

    return Response.json(validation);
  } catch (error) {
    return Response.json({ error: 'Failed to validate MCP config' }, { status: 500 });
  }
}
