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
  tier?: 'free' | 'pro';
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
    tier: 'pro',
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
    tier: 'pro',
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
    icon: 'https://21st.dev/favicon.ico',
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-codinit-elements-textPrimary">Integrations</h2>
        <p className="text-sm text-codinit-elements-textSecondary">
          Easily connect with the tools your team already uses or extend your app with any Python SDK, library, or API.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <i className="i-ph:magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-codinit-elements-textTertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setSelectedCategory(null)}
            className={classNames(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              selectedCategory === null
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-transparent text-codinit-elements-textSecondary border-codinit-elements-borderColor hover:border-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={classNames(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                selectedCategory === category
                  ? 'bg-accent-500 text-white border-accent-500'
                  : 'bg-transparent text-codinit-elements-textSecondary border-codinit-elements-borderColor hover:border-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
              )}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="group relative flex flex-col items-center gap-4 p-6 bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor rounded-xl text-center transition-all hover:border-accent-500/50 hover:shadow-lg hover:-translate-y-1 min-h-[220px]"
            >
              {/* Tags */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Popular
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-codinit-elements-background-depth-3 text-codinit-elements-textSecondary border border-codinit-elements-borderColor">
                  {getCategoryLabel(template.category)}
                </span>
                {template.tier === 'pro' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                    <div className="i-ph:crown-simple-fill text-[10px]" />
                    PRO
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className="mt-8 mb-2">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110"
                  style={{ backgroundColor: template.iconBgColor }}
                >
                  {template.icon.startsWith('http') ? (
                    <img src={template.icon} alt={template.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <i className={classNames(template.icon, 'text-4xl')} style={{ color: template.iconColor }} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-codinit-elements-textPrimary">{template.name}</h3>
                <p className="text-xs text-codinit-elements-textSecondary line-clamp-2 leading-relaxed px-2">
                  {template.description}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-codinit-elements-background-depth-2 flex items-center justify-center mx-auto mb-4 border border-codinit-elements-borderColor">
              <i className="i-ph:magnifying-glass text-3xl text-codinit-elements-textTertiary" />
            </div>
            <p className="text-base font-medium text-codinit-elements-textSecondary">No integrations found</p>
            <p className="text-sm text-codinit-elements-textTertiary mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
});
