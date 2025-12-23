import { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Switch } from '~/components/ui/Switch';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { SettingsSection } from '~/components/@settings/shared/components/SettingsCard';
import { SettingsList, SettingsListItem, SettingsPanel } from '~/components/@settings/shared/components/SettingsPanel';
import {
  agentModeStore,
  agentMaxIterationsStore,
  agentTokenBudgetStore,
  agentSelfCorrectionStore,
  updateAgentMode,
  updateAgentMaxIterations,
  updateAgentTokenBudget,
  updateAgentSelfCorrection,
} from '~/lib/stores/settings';
import { Input } from '~/components/ui/Input';

export default function AgentTab() {
  const agentMode = useStore(agentModeStore);
  const maxIterations = useStore(agentMaxIterationsStore);
  const tokenBudget = useStore(agentTokenBudgetStore);
  const selfCorrection = useStore(agentSelfCorrectionStore);

  const handleToggleAgentMode = useCallback((enabled: boolean) => {
    updateAgentMode(enabled);
    toast.success(`Agent mode ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  const handleToggleSelfCorrection = useCallback((enabled: boolean) => {
    updateAgentSelfCorrection(enabled);
    toast.success(`Self-correction ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  const handleMaxIterationsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    if (value >= 1 && value <= 100) {
      updateAgentMaxIterations(value);
      toast.success(`Max iterations set to ${value}`);
    }
  }, []);

  const handleTokenBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    if (value >= 10000 && value <= 1000000) {
      updateAgentTokenBudget(value);
      toast.success(`Token budget set to ${value.toLocaleString()}`);
    }
  }, []);

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Agent Configuration"
        description="Configure autonomous agent behavior and execution settings"
        icon="i-ph:robot"
        delay={0.1}
      >
        <SettingsPanel variant="section" className="p-6">
          <SettingsList>
            <SettingsListItem>
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={classNames(
                    'flex-shrink-0 w-12 h-12 rounded-xl',
                    'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20',
                    'flex items-center justify-center',
                    'ring-2 ring-green-200/30 dark:ring-green-800/20',
                    'transition-all duration-300',
                  )}
                >
                  <div className="i-ph:robot w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-codinit-elements-textPrimary text-base leading-tight">
                      Agent Mode
                    </h4>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-sm">
                      Experimental
                    </span>
                  </div>
                  <p className="text-sm text-codinit-elements-textSecondary leading-relaxed mb-2">
                    Enable autonomous agent mode with Plan-Execute reasoning for complex tasks
                  </p>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/30 dark:border-green-800/20">
                    <span className="text-xs">💡</span>
                    <span className="text-xs text-codinit-elements-textTertiary">
                      When enabled, AI will autonomously plan and execute multi-step tasks
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Switch checked={agentMode} onCheckedChange={handleToggleAgentMode} />
              </div>
            </SettingsListItem>

            <SettingsListItem>
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={classNames(
                    'flex-shrink-0 w-12 h-12 rounded-xl',
                    'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/20',
                    'flex items-center justify-center',
                    'ring-2 ring-blue-200/30 dark:ring-blue-800/20',
                    'transition-all duration-300',
                  )}
                >
                  <div className="i-ph:first-aid-kit w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-codinit-elements-textPrimary text-base leading-tight mb-1">
                    Self-Correction
                  </h4>
                  <p className="text-sm text-codinit-elements-textSecondary leading-relaxed mb-2">
                    Allow agent to automatically detect and fix errors during execution
                  </p>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/20">
                    <span className="text-xs">💡</span>
                    <span className="text-xs text-codinit-elements-textTertiary">
                      Enables automatic retry with error correction strategies
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Switch checked={selfCorrection} onCheckedChange={handleToggleSelfCorrection} disabled={!agentMode} />
              </div>
            </SettingsListItem>
          </SettingsList>
        </SettingsPanel>
      </SettingsSection>

      <SettingsSection
        title="Execution Limits"
        description="Control resource usage and execution boundaries"
        icon="i-ph:gauge"
        delay={0.2}
      >
        <SettingsPanel variant="section" className="p-6">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-3">
                <div className="i-ph:arrows-clockwise w-5 h-5 text-codinit-elements-textPrimary" />
                <span className="font-semibold text-codinit-elements-textPrimary">Max Iterations</span>
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={maxIterations}
                  onChange={handleMaxIterationsChange}
                  disabled={!agentMode}
                  className="w-32"
                />
                <div className="flex-1">
                  <p className="text-sm text-codinit-elements-textSecondary">
                    Maximum number of planning-execution cycles (1-100)
                  </p>
                  <p className="text-xs text-codinit-elements-textTertiary mt-1">
                    Current: <span className="font-mono text-codinit-elements-textPrimary">{maxIterations}</span>{' '}
                    iterations
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-codinit-elements-borderColor">
              <label className="flex items-center gap-2 mb-3">
                <div className="i-ph:coins w-5 h-5 text-codinit-elements-textPrimary" />
                <span className="font-semibold text-codinit-elements-textPrimary">Token Budget</span>
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={tokenBudget}
                  onChange={handleTokenBudgetChange}
                  disabled={!agentMode}
                  className="w-40"
                />
                <div className="flex-1">
                  <p className="text-sm text-codinit-elements-textSecondary">
                    Maximum tokens for conversation memory (10k-1M)
                  </p>
                  <p className="text-xs text-codinit-elements-textTertiary mt-1">
                    Current:{' '}
                    <span className="font-mono text-codinit-elements-textPrimary">{tokenBudget.toLocaleString()}</span>{' '}
                    tokens
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SettingsPanel>
      </SettingsSection>

      <SettingsSection title="Agent Information" description="Learn more about autonomous agents" icon="i-ph:info" delay={0.3}>
        <SettingsPanel variant="highlight" className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="i-ph:lightbulb w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-codinit-elements-textPrimary mb-2">How Agent Mode Works</h4>
                <ul className="space-y-2 text-sm text-codinit-elements-textSecondary">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">1.</span>
                    <span>
                      <strong className="text-codinit-elements-textPrimary">Planning:</strong> Analyzes your task and
                      creates a structured execution plan
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">2.</span>
                    <span>
                      <strong className="text-codinit-elements-textPrimary">Execution:</strong> Runs each step using
                      available tools and monitors progress
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">3.</span>
                    <span>
                      <strong className="text-codinit-elements-textPrimary">Reflection:</strong> Evaluates results and
                      decides whether to continue or adjust the plan
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-codinit-elements-borderColor">
              <div className="i-ph:warning w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-codinit-elements-textPrimary mb-2">Important Notes</h4>
                <ul className="space-y-1 text-sm text-codinit-elements-textSecondary list-disc list-inside">
                  <li>Agent mode is experimental and may produce unexpected results</li>
                  <li>Higher iterations and token budgets increase execution time and costs</li>
                  <li>Self-correction helps recover from errors but may retry multiple times</li>
                  <li>Monitor agent progress in the Agent view for real-time updates</li>
                </ul>
              </div>
            </div>
          </div>
        </SettingsPanel>
      </SettingsSection>
    </div>
  );
}
