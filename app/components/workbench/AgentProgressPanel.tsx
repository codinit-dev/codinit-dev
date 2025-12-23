import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import type { AgentExecution } from '~/types/agent';

export function AgentProgressPanel() {
  const agentState = useStore(workbenchStore.agentState);
  const currentId = useStore(workbenchStore.currentAgentExecution);

  if (!currentId || !agentState[currentId]) {
    return (
      <div className="flex h-full items-center justify-center text-codinit-elements-textSecondary">
        <div className="text-center">
          <div className="i-ph:robot text-6xl mb-4 opacity-20" />
          <p>No active agent execution</p>
        </div>
      </div>
    );
  }

  const execution = agentState[currentId];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-codinit-elements-background-depth-1">
      <AgentHeader execution={execution} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {execution.plan && <PlanDisplay plan={execution.plan} currentStep={execution.currentStep} />}

        {execution.toolCalls.length > 0 && <ToolCallList toolCalls={execution.toolCalls} />}

        {execution.observations.length > 0 && <ObservationList observations={execution.observations} />}

        {execution.reflections.length > 0 && <ReflectionList reflections={execution.reflections} />}

        {execution.error && <ErrorDisplay error={execution.error} recoveryAttempts={execution.recoveryAttempts} />}
      </div>
    </div>
  );
}

function AgentHeader({ execution }: { execution: AgentExecution }) {
  const statusColors = {
    idle: 'text-codinit-elements-textSecondary',
    planning: 'text-codinit-elements-loader-progress',
    executing: 'text-codinit-elements-loader-progress',
    observing: 'text-codinit-elements-loader-progress',
    reflecting: 'text-codinit-elements-loader-progress',
    complete: 'text-codinit-elements-icon-success',
    failed: 'text-codinit-elements-icon-error',
    aborted: 'text-codinit-elements-textSecondary',
  };

  const statusIcons = {
    idle: 'i-ph:clock',
    planning: 'i-ph:lightbulb',
    executing: 'i-ph:play',
    observing: 'i-ph:eye',
    reflecting: 'i-ph:brain',
    complete: 'i-ph:check-circle',
    failed: 'i-ph:x-circle',
    aborted: 'i-ph:stop-circle',
  };

  return (
    <div className="border-b border-codinit-elements-borderColor p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={classNames('text-2xl', statusIcons[execution.status])} />
          <div>
            <h2 className="text-lg font-semibold text-codinit-elements-textPrimary">{execution.task}</h2>
            <p className={classNames('text-sm', statusColors[execution.status])}>{execution.status}</p>
          </div>
        </div>
        <div className="text-right text-sm text-codinit-elements-textSecondary">
          <div>Time: {Math.floor(execution.elapsedTime / 1000)}s</div>
          <div>Tokens: {execution.tokensUsed.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function PlanDisplay({ plan, currentStep }: { plan: any; currentStep?: number }) {
  return (
    <div className="bg-codinit-elements-background-depth-2 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-codinit-elements-textPrimary mb-3 flex items-center gap-2">
        <span className="i-ph:list-checks" />
        Plan ({plan.steps.length} steps)
      </h3>
      <div className="space-y-2">
        {plan.steps.map((step: any) => (
          <div
            key={step.number}
            className={classNames(
              'p-3 rounded border',
              currentStep === step.number
                ? 'border-codinit-elements-loader-progress bg-codinit-elements-loader-progress/10'
                : 'border-codinit-elements-borderColor',
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className={classNames(
                  'text-xs font-mono px-2 py-1 rounded',
                  currentStep === step.number ? 'bg-codinit-elements-loader-progress text-white' : 'bg-gray-500/20',
                )}
              >
                {step.number}
              </span>
              <div className="flex-1">
                <p className="text-sm text-codinit-elements-textPrimary">{step.description}</p>
                {step.tools && step.tools.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {step.tools.map((tool: string) => (
                      <span
                        key={tool}
                        className="text-xs px-2 py-1 rounded bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolCallList({ toolCalls }: { toolCalls: any[] }) {
  return (
    <div className="bg-codinit-elements-background-depth-2 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-codinit-elements-textPrimary mb-3 flex items-center gap-2">
        <span className="i-ph:wrench" />
        Tool Calls ({toolCalls.length})
      </h3>
      <div className="space-y-2">
        {toolCalls.map((call) => (
          <div
            key={call.id}
            className="p-3 rounded border border-codinit-elements-borderColor bg-codinit-elements-background-depth-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="i-ph:function text-codinit-elements-loader-progress" />
              <span className="text-sm font-mono text-codinit-elements-textPrimary">{call.name}</span>
              <span className="text-xs text-codinit-elements-textSecondary">
                {new Date(call.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {call.arguments && Object.keys(call.arguments).length > 0 && (
              <pre className="text-xs text-codinit-elements-textSecondary overflow-x-auto">
                {JSON.stringify(call.arguments, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ObservationList({ observations }: { observations: any[] }) {
  return (
    <div className="bg-codinit-elements-background-depth-2 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-codinit-elements-textPrimary mb-3 flex items-center gap-2">
        <span className="i-ph:eye" />
        Observations ({observations.length})
      </h3>
      <div className="space-y-2">
        {observations.map((obs, idx) => (
          <div
            key={idx}
            className="p-3 rounded border border-codinit-elements-borderColor bg-codinit-elements-background-depth-1"
          >
            <div className="flex items-start gap-2">
              {obs.success ? (
                <span className="i-ph:check-circle text-codinit-elements-icon-success" />
              ) : (
                <span className="i-ph:warning text-codinit-elements-icon-error" />
              )}
              <p className="text-sm text-codinit-elements-textPrimary flex-1">{obs.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReflectionList({ reflections }: { reflections: any[] }) {
  return (
    <div className="bg-codinit-elements-background-depth-2 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-codinit-elements-textPrimary mb-3 flex items-center gap-2">
        <span className="i-ph:brain" />
        Reflections ({reflections.length})
      </h3>
      <div className="space-y-3">
        {reflections.map((ref, idx) => (
          <div
            key={idx}
            className="p-3 rounded border border-codinit-elements-borderColor bg-codinit-elements-background-depth-1"
          >
            <div className="flex items-center gap-2 mb-2">
              {ref.goalAchieved ? (
                <span className="i-ph:check-circle text-codinit-elements-icon-success" />
              ) : (
                <span className="i-ph:arrow-clockwise text-codinit-elements-loader-progress" />
              )}
              <span className="text-sm font-semibold">{ref.goalAchieved ? 'Goal Achieved' : 'Continuing...'}</span>
            </div>

            {ref.issues && ref.issues.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-codinit-elements-textSecondary mb-1">Issues:</p>
                <ul className="text-sm text-codinit-elements-textPrimary list-disc list-inside">
                  {ref.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {ref.nextActions && ref.nextActions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-codinit-elements-textSecondary mb-1">Next Actions:</p>
                <ul className="text-sm text-codinit-elements-textPrimary list-disc list-inside">
                  {ref.nextActions.map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorDisplay({ error, recoveryAttempts }: { error: string; recoveryAttempts: number }) {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
        <span className="i-ph:warning-circle" />
        Error
      </h3>
      <p className="text-sm text-codinit-elements-textPrimary mb-2">{error}</p>
      {recoveryAttempts > 0 && (
        <p className="text-xs text-codinit-elements-textSecondary">Recovery attempts: {recoveryAttempts}</p>
      )}
    </div>
  );
}
