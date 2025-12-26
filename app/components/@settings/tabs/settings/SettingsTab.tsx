import { useState } from 'react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { SettingsSection } from '~/components/@settings/shared/components/SettingsCard';

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
    <div className="space-y-8">
      <SettingsSection title="Project General Settings">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-codinit-elements-textPrimary">Project name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className={classNames(
                'flex-1 px-4 py-2.5 rounded-lg text-sm',
                'bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor',
                'text-codinit-elements-textPrimary placeholder-gray-500',
                'focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20',
                'transition-all duration-200'
              )}
            />
            <button
              onClick={handleSaveName}
              className="px-6 py-2.5 bg-codinit-elements-background-depth-1 hover:bg-codinit-elements-background-depth-2 text-codinit-elements-textPrimary rounded-lg text-sm font-medium transition-colors border border-codinit-elements-borderColor"
            >
              Save
            </button>
          </div>
        </div>

        {/* Project Agent */}
        <div className="space-y-2 pt-6">
          <label className="text-sm font-bold text-codinit-elements-textPrimary">Project Agent</label>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedAgent('claude')}
              className={classNames(
                'relative px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 border text-left min-w-[140px]',
                selectedAgent === 'claude'
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                  : 'bg-codinit-elements-background-depth-1 border-codinit-elements-borderColor text-codinit-elements-textSecondary hover:border-codinit-elements-borderColorActive'
              )}
            >
              Claude Agent
            </button>

            <div className={classNames(
              'relative px-6 py-4 rounded-xl text-sm font-medium border text-left min-w-[140px]',
              'bg-codinit-elements-background-depth-1 border-codinit-elements-borderColor text-codinit-elements-textSecondary opacity-60 cursor-not-allowed'
            )}>
              <div className="flex items-center gap-2">
                <span>Codex</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-codinit-elements-background-depth-2 text-gray-400 uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedAgent('v1')}
              className={classNames(
                'relative px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 border text-left min-w-[140px]',
                selectedAgent === 'v1'
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                  : 'bg-codinit-elements-background-depth-1 border-codinit-elements-borderColor text-codinit-elements-textSecondary hover:border-codinit-elements-borderColorActive'
              )}
            >
              v1 Agent (legacy)
            </button>
          </div>
        </div>

        {/* Context */}
        <div className="space-y-2 pt-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-codinit-elements-textPrimary">Context</label>
            <button
              onClick={handleClearContext}
              className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
            >
              Clear context
            </button>
          </div>
          <p className="text-sm text-codinit-elements-textSecondary">
            Free up context. This is useful when a part of your app is completed and you want to work on a new one.
          </p>
        </div>

        {/* Project Visibility */}
        <div className="space-y-2 pt-6">
          <label className="text-sm font-bold text-codinit-elements-textPrimary">Project Visibility</label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setVisibility('private')}
              className={classNames(
                'p-4 rounded-xl text-left transition-all duration-200 border',
                visibility === 'private'
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-codinit-elements-background-depth-1 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={classNames(
                  'i-ph:lock-key-fill w-4 h-4',
                  visibility === 'private' ? 'text-blue-400' : 'text-gray-400'
                )} />
                <span className={classNames(
                  'font-medium text-sm',
                  visibility === 'private' ? 'text-blue-400' : 'text-codinit-elements-textPrimary'
                )}>
                  Private
                </span>
              </div>
              <p className="text-xs text-codinit-elements-textSecondary">
                Only owner can access
              </p>
            </button>

            <button
              onClick={() => setVisibility('secret')}
              className={classNames(
                'p-4 rounded-xl text-left transition-all duration-200 border',
                visibility === 'secret'
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-codinit-elements-background-depth-1 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={classNames(
                  'i-ph:eye-slash-fill w-4 h-4',
                  visibility === 'secret' ? 'text-blue-400' : 'text-gray-400'
                )} />
                <span className={classNames(
                  'font-medium text-sm',
                  visibility === 'secret' ? 'text-blue-400' : 'text-codinit-elements-textPrimary'
                )}>
                  Secret
                </span>
              </div>
              <p className="text-xs text-codinit-elements-textSecondary">
                Accessible via shared URL
              </p>
            </button>

            <button
              onClick={() => setVisibility('public')}
              className={classNames(
                'p-4 rounded-xl text-left transition-all duration-200 border',
                visibility === 'public'
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-codinit-elements-background-depth-1 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={classNames(
                  'i-ph:globe-fill w-4 h-4',
                  visibility === 'public' ? 'text-blue-400' : 'text-gray-400'
                )} />
                <span className={classNames(
                  'font-medium text-sm',
                  visibility === 'public' ? 'text-blue-400' : 'text-codinit-elements-textPrimary'
                )}>
                  Public
                </span>
              </div>
              <p className="text-xs text-codinit-elements-textSecondary">
                Everyone can view
              </p>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-codinit-elements-textSecondary">
            <div className="i-ph:info w-4 h-4" />
            <span>Looking to share your site privately? Click <span className="font-bold text-codinit-elements-textPrimary">Share</span> in the top-right corner of your screen.</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
