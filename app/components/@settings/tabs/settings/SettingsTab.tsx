import { useState } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { SettingsSection, SettingsCard } from '~/components/@settings/shared/components/SettingsCard';
import { Badge } from '~/components/ui/Badge';

type ProjectVisibility = 'private' | 'secret' | 'public';
type AgentType = 'claude' | 'codex' | 'v1';

export default function SettingsTab() {
  const [projectName, setProjectName] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('claude');
  const [visibility, setVisibility] = useState<ProjectVisibility>('private');

  const handleSaveName = () => {
    if (!projectName.trim()) {
      toast.error('Project name cannot be empty');
      return;
    }

    toast.success('Project name saved');
  };

  const handleClearContext = () => {
    toast.success('Context cleared');
  };

  return (
    <div className="space-y-10">
      <SettingsSection
        title="Project Settings"
        description="Manage your project details, AI configuration and access controls."
        icon="i-ph:gear-duotone"
      >
        <div className="grid grid-cols-1 gap-8">
          {/* Project Name Card */}
          <SettingsCard variant="gradient" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="i-ph:pencil-line-duotone text-blue-500 w-5 h-5" />
                <label className="text-sm font-bold text-codinit-elements-textPrimary">Project Identity</label>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className={classNames(
                      'w-full px-4 py-3 rounded-xl text-sm transition-all duration-300',
                      'bg-white dark:bg-black/20 border border-codinit-elements-borderColor',
                      'text-codinit-elements-textPrimary placeholder-gray-400 dark:placeholder-gray-600',
                      'focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10',
                      'group-hover:border-codinit-elements-borderColorActive',
                    )}
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-transparent group-hover:border-blue-500/20 transition-colors duration-300" />
                </div>
                <button
                  onClick={handleSaveName}
                  className={classNames(
                    'px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300',
                    'bg-blue-600 hover:bg-blue-700 text-white',
                    'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
                    'active:scale-95',
                  )}
                >
                  Save Changes
                </button>
              </div>
              <p className="text-xs text-codinit-elements-textSecondary">
                This name will be used across the platform to identify your work.
              </p>
            </div>
          </SettingsCard>

          {/* Agent Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="i-ph:robot-duotone text-blue-500 w-5 h-5" />
                <h3 className="text-sm font-bold text-codinit-elements-textPrimary uppercase tracking-wider">
                  AI Intelligence Agent
                </h3>
              </div>
              <Badge variant="primary" size="sm" icon="i-ph:sparkle-fill">
                PRO FEATURE
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'claude',
                  label: 'Claude Agent',
                  icon: 'i-ph:brain-duotone',
                  desc: 'State-of-the-art reasoning and coding abilities.',
                  badge: 'MOST POPULAR',
                },
                {
                  id: 'codex',
                  label: 'Codex AI',
                  icon: 'i-ph:lightning-duotone',
                  desc: 'Fast, efficient completions for routine tasks.',
                  comingSoon: true,
                },
                {
                  id: 'v1',
                  label: 'v1 Legacy',
                  icon: 'i-ph:history-duotone',
                  desc: 'Classic engine for specialized requirements.',
                  badge: 'LEGACY',
                },
              ].map((agent) => (
                <button
                  key={agent.id}
                  disabled={agent.comingSoon}
                  onClick={() => setSelectedAgent(agent.id as AgentType)}
                  className={classNames(
                    'relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 text-left h-full',
                    agent.comingSoon
                      ? 'opacity-50 cursor-not-allowed grayscale bg-gray-50/50 dark:bg-white/5'
                      : 'cursor-pointer hover:shadow-md dark:hover:shadow-blue-900/10',
                    selectedAgent === agent.id && !agent.comingSoon
                      ? 'bg-blue-500/5 border-blue-500/50 ring-1 ring-blue-500/20 shadow-inner dark:bg-blue-500/10'
                      : 'bg-white dark:bg-black/20 border-codinit-elements-borderColor hover:border-blue-300 dark:hover:border-blue-700',
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={classNames(
                        'p-2 rounded-lg',
                        selectedAgent === agent.id && !agent.comingSoon
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                      )}
                    >
                      <div className={classNames(agent.icon, 'w-5 h-5')} />
                    </div>
                    {agent.badge && (
                      <Badge variant={agent.id === 'v1' ? 'secondary' : 'info'} size="sm">
                        {agent.badge}
                      </Badge>
                    )}
                    {agent.comingSoon && (
                      <Badge variant="subtle" size="sm">
                        COMING SOON
                      </Badge>
                    )}
                  </div>
                  <span
                    className={classNames(
                      'font-bold text-sm mb-1',
                      selectedAgent === agent.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-codinit-elements-textPrimary',
                    )}
                  >
                    {agent.label}
                  </span>
                  <p className="text-xs text-codinit-elements-textSecondary leading-relaxed">{agent.desc}</p>

                  {selectedAgent === agent.id && !agent.comingSoon && (
                    <motion.div layoutId="agent-check" className="absolute top-2 right-2 text-blue-500">
                      <div className="i-ph:check-circle-fill w-4 h-4" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="i-ph:share-network-duotone text-blue-500 w-5 h-5" />
              <h3 className="text-sm font-bold text-codinit-elements-textPrimary uppercase tracking-wider">
                Project Access & Visibility
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'private',
                  label: 'Private',
                  desc: 'Secure vault for your eyes only.',
                  icon: 'i-ph:lock-key-duotone',
                  color: 'text-rose-500',
                  recommended: true,
                },
                {
                  id: 'secret',
                  label: 'Secret',
                  desc: 'Invisible except with a direct link.',
                  icon: 'i-ph:shield-check-duotone',
                  color: 'text-amber-500',
                },
                {
                  id: 'public',
                  label: 'Public',
                  desc: 'Open source for the entire world.',
                  icon: 'i-ph:globe-hemisphere-east-duotone',
                  color: 'text-emerald-500',
                },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setVisibility(option.id as ProjectVisibility)}
                  className={classNames(
                    'relative group p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden h-full',
                    visibility === option.id
                      ? 'bg-blue-500/5 border-blue-500/50 dark:bg-blue-500/10'
                      : 'bg-white dark:bg-black/20 border-codinit-elements-borderColor hover:border-blue-300 dark:hover:border-blue-800',
                  )}
                >
                  <div className="flex items-start gap-4 h-full relative z-10">
                    <div
                      className={classNames(
                        'p-2.5 rounded-xl transition-colors duration-300 flex-shrink-0',
                        visibility === option.id ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800',
                      )}
                    >
                      <div className={classNames(option.icon, option.color, 'w-6 h-6')} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={classNames(
                            'font-bold text-sm',
                            visibility === option.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-codinit-elements-textPrimary',
                          )}
                        >
                          {option.label}
                        </span>
                        {option.recommended && (
                          <div className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500 text-white uppercase">
                            TOP CHOICE
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-codinit-elements-textSecondary leading-relaxed">{option.desc}</p>
                    </div>
                  </div>
                  {visibility === option.id && (
                    <div className="absolute top-0 right-0 h-10 w-10 flex items-center justify-center translate-x-2 -translate-y-2">
                      <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 dark:bg-blue-500/10">
              <div className="i-ph:info-duotone text-blue-500 w-5 h-5 shrink-0" />
              <p className="text-xs text-codinit-elements-textSecondary leading-relaxed">
                Looking to share your site privately? Use the{' '}
                <span className="font-bold text-codinit-elements-textPrimary underline decoration-blue-500/30">
                  Share
                </span>{' '}
                control in the header for temporary access.
              </p>
            </div>
          </div>

          {/* Context Management Card */}
          <SettingsCard variant="default" className="p-0 overflow-hidden border-red-500/10 dark:border-red-500/20">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="i-ph:broom-duotone text-red-500 w-5 h-5" />
                  <label className="text-sm font-bold text-codinit-elements-textPrimary uppercase tracking-wider">
                    Maintenance
                  </label>
                </div>
                <button
                  onClick={handleClearContext}
                  className={classNames(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300',
                    'bg-red-500 hover:bg-red-600 text-white',
                    'shadow-lg shadow-red-500/20 active:scale-95',
                  )}
                >
                  Clear Environment Context
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-codinit-elements-textPrimary mb-1">Purge Active Context</h4>
                  <p className="text-xs text-codinit-elements-textSecondary leading-relaxed">
                    Instantly free up AI memory. Highly recommended when shifting focus to a new feature or after a
                    major component is finished.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-500/5 dark:bg-red-500/10 px-6 py-2 border-t border-red-500/10">
              <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-[0.2em]">
                Warning: This action cannot be undone
              </p>
            </div>
          </SettingsCard>
        </div>
      </SettingsSection>
    </div>
  );
}
