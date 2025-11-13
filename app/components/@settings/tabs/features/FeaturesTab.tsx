import { useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { SettingsSection } from '~/components/@settings/shared/components/SettingsCard';
import { SettingsList, SettingsListItem, SettingsPanel } from '~/components/@settings/shared/components/SettingsPanel';

interface FeatureToggle {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  beta?: boolean;
  experimental?: boolean;
  tooltip?: string;
}

export default function FeaturesTab() {
  const {
    autoSelectTemplate,
    isLatestBranch,
    contextOptimizationEnabled,
    eventLogs,
    setAutoSelectTemplate,
    enableLatestBranch,
    enableContextOptimization,
    setEventLogs,
    setPromptId,
    promptId,
  } = useSettings();

  // Enable features by default on first load
  useCallback(() => {
    // Only set defaults if values are undefined
    if (isLatestBranch === undefined) {
      enableLatestBranch(false); // Default: OFF - Don't auto-update from main branch
    }

    if (contextOptimizationEnabled === undefined) {
      enableContextOptimization(true); // Default: ON - Enable context optimization
    }

    if (autoSelectTemplate === undefined) {
      setAutoSelectTemplate(true); // Default: ON - Enable auto-select templates
    }

    if (promptId === undefined) {
      setPromptId('default'); // Default: 'default'
    }

    if (eventLogs === undefined) {
      setEventLogs(true); // Default: ON - Enable event logging
    }
  }, []); // Only run once on component mount

  const handleToggleFeature = useCallback(
    (id: string, enabled: boolean) => {
      switch (id) {
        case 'latestBranch': {
          enableLatestBranch(enabled);
          toast.success(`Main branch updates ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'autoSelectTemplate': {
          setAutoSelectTemplate(enabled);
          toast.success(`Auto select template ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'contextOptimization': {
          enableContextOptimization(enabled);
          toast.success(`Context optimization ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'eventLogs': {
          setEventLogs(enabled);
          toast.success(`Event logging ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        default:
          break;
      }
    },
    [enableLatestBranch, setAutoSelectTemplate, enableContextOptimization, setEventLogs],
  );

  const features: { stable: FeatureToggle[]; beta: FeatureToggle[] } = {
    stable: [
      {
        id: 'latestBranch',
        title: 'Main Branch Updates',
        description: 'Get the latest updates from the main branch',
        icon: 'i-ph:git-branch',
        enabled: isLatestBranch,
        tooltip: 'Enabled by default to receive updates from the main development branch',
      },
      {
        id: 'autoSelectTemplate',
        title: 'Auto Select Template',
        description: 'Automatically select starter template',
        icon: 'i-ph:selection',
        enabled: autoSelectTemplate,
        tooltip: 'Enabled by default to automatically select the most appropriate starter template',
      },
      {
        id: 'contextOptimization',
        title: 'Context Optimization',
        description: 'Optimize context for better responses',
        icon: 'i-ph:brain',
        enabled: contextOptimizationEnabled,
        tooltip: 'Enabled by default for improved AI responses',
      },
      {
        id: 'eventLogs',
        title: 'Event Logging',
        description: 'Enable detailed event logging and history',
        icon: 'i-ph:list-bullets',
        enabled: eventLogs,
        tooltip: 'Enabled by default to record detailed logs of system events and user actions',
      },
    ],
    beta: [],
  };

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Core Features"
        description="Essential features that are enabled by default for optimal performance"
        icon="i-ph:check-circle"
        delay={0.1}
      >
        <SettingsPanel variant="section" className="p-6">
          <SettingsList>
            {features.stable.map((feature, _index) => (
              <SettingsListItem key={feature.id}>
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={classNames(
                      'flex-shrink-0 w-12 h-12 rounded-xl',
                      'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/20',
                      'flex items-center justify-center',
                      'ring-2 ring-blue-200/30 dark:ring-blue-800/20',
                      'transition-all duration-300',
                    )}
                  >
                    <div className={classNames(feature.icon, 'w-6 h-6 text-blue-600 dark:text-blue-400')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-codinit-elements-textPrimary text-base leading-tight">
                        {feature.title}
                      </h4>
                      {feature.beta && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-sm">
                          Beta
                        </span>
                      )}
                      {feature.experimental && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-sm">
                          Experimental
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-codinit-elements-textSecondary leading-relaxed mb-2">
                      {feature.description}
                    </p>
                    {feature.tooltip && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/20">
                        <span className="text-xs">💡</span>
                        <span className="text-xs text-codinit-elements-textTertiary">{feature.tooltip}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                  />
                </div>
              </SettingsListItem>
            ))}
          </SettingsList>
        </SettingsPanel>
      </SettingsSection>

      {features.beta.length > 0 && (
        <SettingsSection
          title="Beta Features"
          description="New features that are ready for testing but may have some rough edges"
          icon="i-ph:test-tube"
          delay={0.2}
        >
          <SettingsPanel variant="subsection" className="p-6">
            <SettingsList>
              {features.beta.map((feature, _index) => (
                <SettingsListItem key={feature.id}>
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={classNames(
                        'flex-shrink-0 w-12 h-12 rounded-xl',
                        'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/20',
                        'flex items-center justify-center',
                        'ring-2 ring-orange-200/30 dark:ring-orange-800/20',
                        'transition-all duration-300',
                      )}
                    >
                      <div className={classNames(feature.icon, 'w-6 h-6 text-orange-600 dark:text-orange-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-codinit-elements-textPrimary text-base leading-tight">
                          {feature.title}
                        </h4>
                        {feature.beta && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-sm">
                            Beta
                          </span>
                        )}
                        {feature.experimental && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-sm">
                            Experimental
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-codinit-elements-textSecondary leading-relaxed mb-2">
                        {feature.description}
                      </p>
                      {feature.tooltip && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/30 dark:border-orange-800/20">
                          <span className="text-xs">💡</span>
                          <span className="text-xs text-codinit-elements-textTertiary">{feature.tooltip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                    />
                  </div>
                </SettingsListItem>
              ))}
            </SettingsList>
          </SettingsPanel>
        </SettingsSection>
      )}

      <SettingsSection
        title="Prompt Library"
        description="Choose a prompt template to customize your AI interactions"
        icon="i-ph:book"
        delay={0.3}
      >
        <SettingsPanel variant="highlight" className="p-6">
          <div className="flex items-center gap-6">
            <div
              className={classNames(
                'flex-shrink-0 w-16 h-16 rounded-2xl',
                'bg-gradient-to-br from-blue-500 to-purple-600',
                'flex items-center justify-center',
                'shadow-lg',
              )}
            >
              <div className="i-ph:book w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-codinit-elements-textPrimary mb-1">System Prompt Template</h4>
              <p className="text-sm text-codinit-elements-textSecondary">
                Choose a prompt from the library to use as the system prompt for AI interactions
              </p>
            </div>
            <div className="flex-shrink-0">
              <select
                value={promptId}
                onChange={(e) => {
                  setPromptId(e.target.value);
                  toast.success('Prompt template updated');
                }}
                className={classNames(
                  'px-4 py-3 rounded-xl text-sm font-medium min-w-[240px]',
                  'bg-white dark:bg-[#0F0F0F]',
                  'border-2 border-gray-200 dark:border-[#2A2A2A]',
                  'text-codinit-elements-textPrimary',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
                  'hover:border-gray-300 dark:hover:border-[#3A3A3A]',
                  'transition-all duration-200',
                  'shadow-sm hover:shadow-md',
                )}
              >
                {PromptLibrary.getList().map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SettingsPanel>
      </SettingsSection>
    </div>
  );
}
