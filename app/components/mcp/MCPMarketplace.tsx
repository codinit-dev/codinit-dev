import { memo, useState, useMemo } from 'react';
import { classNames } from '~/utils/classNames';
import type { MCPServerConfig } from '~/types/mcp';

export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  category: 'database' | 'analytics' | 'payment' | 'ai' | 'productivity' | 'development';
  config: MCPServerConfig;
  requiredFields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
  }>;
}

export const MCP_TEMPLATES: MCPTemplate[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'PostgreSQL database with real-time subscriptions and auth',
    icon: 'i-simple-icons:supabase',
    iconColor: '#3FCF8E',
    iconBgColor: '#1e1e1e',
    category: 'database',
    config: {
      type: 'sse',
      url: 'https://mcp.supabase.com/v1',
    },
    requiredFields: [
      {
        key: 'url',
        label: 'Project URL',
        placeholder: 'https://your-project.supabase.co',
        type: 'url',
        required: true,
      },
      { key: 'apiKey', label: 'API Key', placeholder: 'your-anon-key', type: 'password', required: true },
    ],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Integration with Claude AI for code generation and analysis',
    icon: 'i-simple-icons:anthropic',
    iconColor: '#D4A574',
    iconBgColor: '#1a1515',
    category: 'ai',
    config: {
      type: 'stdio',
      command: 'claude-code-mcp',
    },
    requiredFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...', type: 'password', required: true }],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management',
    icon: 'i-simple-icons:stripe',
    iconColor: '#635BFF',
    iconBgColor: '#ffffff',
    category: 'payment',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.stripe.com/v1',
    },
    requiredFields: [
      { key: 'apiKey', label: 'Secret Key', placeholder: 'sk_test_...', type: 'password', required: true },
    ],
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Product analytics and feature flags',
    icon: 'i-simple-icons:posthog',
    iconColor: '#F54E00',
    iconBgColor: '#1d1d1d',
    category: 'analytics',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.posthog.com/v1',
    },
    requiredFields: [
      { key: 'projectApiKey', label: 'Project API Key', placeholder: 'phc_...', type: 'password', required: true },
      { key: 'host', label: 'Host (optional)', placeholder: 'https://app.posthog.com', type: 'url', required: false },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing automation',
    icon: 'i-simple-icons:hubspot',
    iconColor: '#FF7A59',
    iconBgColor: '#ffffff',
    category: 'productivity',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.hubspot.com/v1',
    },
    requiredFields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'pat-na1-...', type: 'password', required: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repository management and code collaboration',
    icon: 'i-simple-icons:github',
    iconColor: '#ffffff',
    iconBgColor: '#181717',
    category: 'development',
    config: {
      type: 'stdio',
      command: 'mcp-server-github',
    },
    requiredFields: [
      { key: 'token', label: 'Personal Access Token', placeholder: 'ghp_...', type: 'password', required: true },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deployment and hosting platform',
    icon: 'i-simple-icons:vercel',
    iconColor: '#ffffff',
    iconBgColor: '#000000',
    category: 'development',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.vercel.com/v1',
    },
    requiredFields: [
      { key: 'token', label: 'Access Token', placeholder: 'your-vercel-token', type: 'password', required: true },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    icon: 'i-simple-icons:slack',
    iconColor: '#ffffff',
    iconBgColor: '#4A154B',
    category: 'productivity',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.slack.com/v1',
    },
    requiredFields: [
      { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...', type: 'password', required: true },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Knowledge base and documentation',
    icon: 'i-simple-icons:notion',
    iconColor: '#ffffff',
    iconBgColor: '#000000',
    category: 'productivity',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.notion.so/v1',
    },
    requiredFields: [
      { key: 'token', label: 'Integration Token', placeholder: 'secret_...', type: 'password', required: true },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models and AI capabilities',
    icon: 'i-simple-icons:openai',
    iconColor: '#ffffff',
    iconBgColor: '#412991',
    category: 'ai',
    config: {
      type: 'stdio',
      command: 'mcp-server-openai',
    },
    requiredFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...', type: 'password', required: true }],
  },
  {
    id: '21st-dev',
    name: '21st.dev',
    description: 'Use 21st.dev Magic MCP to build your next.js app components.',
    icon: 'https://21st.dev/brand/21st-logo-dark.png',
    iconColor: '#ffffff',
    iconBgColor: '#0255fbff',
    category: 'development',
    config: {
      type: 'streamable-http',
      url: 'https://mcp.21st.dev/v1',
    },
    requiredFields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'your-api-key', type: 'password', required: true },
    ],
  },
];

interface MCPMarketplaceProps {
  onSelectTemplate: (template: MCPTemplate) => void;
}

export const McpMarketplace = memo(({ onSelectTemplate }: MCPMarketplaceProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(MCP_TEMPLATES.map((t) => t.category));
    return Array.from(cats);
  }, []);

  const filteredTemplates = useMemo(() => {
    return MCP_TEMPLATES.filter((template) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === null || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryLabel = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <i className="i-ph:magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-codinit-elements-textTertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-9 pr-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={classNames(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              selectedCategory === null
                ? 'bg-accent-500 text-white'
                : 'bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                selectedCategory === category
                  ? 'bg-accent-500 text-white'
                  : 'bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
              )}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="flex items-center gap-3 p-3 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-left transition-all hover:border-accent-500/50 hover:bg-codinit-elements-background-depth-2"
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: template.iconBgColor }}
              >
                <i className={classNames(template.icon, 'text-xl')} style={{ color: template.iconColor }} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-codinit-elements-textPrimary mb-0.5">{template.name}</h3>
                <p className="text-xs text-codinit-elements-textSecondary line-clamp-1">{template.description}</p>
              </div>

              <div className="flex-shrink-0">
                <i className="i-ph:arrow-right text-codinit-elements-textTertiary" />
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-codinit-elements-background-depth-1 flex items-center justify-center mx-auto mb-3">
              <i className="i-ph:magnifying-glass text-2xl text-codinit-elements-textTertiary" />
            </div>
            <p className="text-sm text-codinit-elements-textSecondary">No integrations found</p>
            <p className="text-xs text-codinit-elements-textTertiary mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
});
