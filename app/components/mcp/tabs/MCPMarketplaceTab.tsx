/* eslint-disable @typescript-eslint/naming-convention */
import { useState } from 'react';
import { McpMarketplace } from '~/components/mcp/MCPMarketplace';
import { McpTemplateConfigDialog } from '~/components/mcp/MCPTemplateConfigDialog';
import type { MCPTemplate } from '~/components/mcp/MCPMarketplace';
import { useMCPStore } from '~/lib/stores/mcp';
import { toast } from 'react-toastify';
import type { MCPServerConfig } from '~/types/mcp';

function MCPMarketplaceTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<MCPTemplate | null>(null);
  const [isTemplateConfigOpen, setIsTemplateConfigOpen] = useState(false);

  const settings = useMCPStore((state) => state.settings);
  const updateSettings = useMCPStore((state) => state.updateSettings);

  const handleSelectTemplate = (template: MCPTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateConfigOpen(true);
  };

  const handleSaveTemplate = async (name: string, config: MCPServerConfig) => {
    try {
      const newConfig = {
        ...settings,
        mcpConfig: {
          mcpServers: {
            ...settings.mcpConfig.mcpServers,
            [name]: config,
          },
        },
      };

      await updateSettings(newConfig);
      setIsTemplateConfigOpen(false);
      setSelectedTemplate(null);
      toast.success(`Server "${name}" added successfully from template`);
    } catch (error) {
      toast.error(`Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  return (
    <>
      <div className="text-sm text-codinit-elements-textSecondary mb-6">
        <p>
          Browse pre-configured MCP server templates to quickly add integrations. Select a template to configure and
          connect it to your workspace.
        </p>
      </div>

      <McpMarketplace onSelectTemplate={handleSelectTemplate} />

      <McpTemplateConfigDialog
        isOpen={isTemplateConfigOpen}
        onClose={() => {
          setIsTemplateConfigOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </>
  );
}

export default MCPMarketplaceTab;
