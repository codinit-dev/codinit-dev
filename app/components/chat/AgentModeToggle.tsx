import { useStore } from '@nanostores/react';
import { agentModeStore, updateAgentMode } from '~/lib/stores/settings';
import * as Tooltip from '@radix-ui/react-tooltip';
import { IconButton } from '~/components/ui/IconButton';

export function AgentModeToggle() {
  const agentModeEnabled = useStore(agentModeStore);

  const toggleAgentMode = () => {
    updateAgentMode(!agentModeEnabled);
  };

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <IconButton
          title="Agent Mode"
          onClick={toggleAgentMode}
          className={agentModeEnabled ? 'i-ph:robot-duotone text-green-400' : 'i-ph:robot text-gray-400'}
        >
          <div className={agentModeEnabled ? 'i-ph:robot-duotone text-green-400' : 'i-ph:robot text-gray-400'} />
        </IconButton>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-50 px-2.5 py-1.5 max-w-[250px] rounded-md bg-gray-900 text-xs text-white shadow-sm"
          sideOffset={5}
        >
          {agentModeEnabled ? (
            <>
              <div className="font-semibold text-green-400">Agent Mode Active</div>
              <div className="text-gray-300 mt-1">AI will autonomously plan and execute tasks with self-correction</div>
            </>
          ) : (
            <>
              <div className="font-semibold">Agent Mode Disabled</div>
              <div className="text-gray-300 mt-1">Click to enable autonomous agent execution</div>
            </>
          )}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
