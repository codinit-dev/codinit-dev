import { memo, useState, useEffect } from 'react';
import { TextShimmer } from '~/components/ui/text-shimmer';

interface ThinkingProcessProps {
  children: React.ReactNode;
  isStreaming?: boolean;
}

export const ThinkingProcess = memo(({ children, isStreaming = false }: ThinkingProcessProps) => {
  const [displayedSteps, setDisplayedSteps] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const parseSteps = (content: React.ReactNode): string[] => {
    if (typeof content !== 'string') {
      return [];
    }

    const lines = content.split('\n').filter((line) => line.trim());
    const steps: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();

      const numberedMatch = trimmed.match(/^\d+\.\s*(.+)$/);

      if (numberedMatch) {
        steps.push(numberedMatch[1]);
        return;
      }

      const bulletMatch = trimmed.match(/^[-*]\s*(.+)$/);

      if (bulletMatch) {
        steps.push(bulletMatch[1]);
        return;
      }

      if (trimmed.length > 0) {
        steps.push(trimmed);
      }
    });

    return steps;
  };

  const steps = parseSteps(children);

  useEffect(() => {
    if (steps.length === 0) {
      return undefined;
    }

    // If not streaming, show all steps immediately
    if (!isStreaming) {
      setDisplayedSteps(steps);
      setIsComplete(true);

      return undefined;
    }

    // If streaming, show steps progressively
    setDisplayedSteps([]);
    setIsComplete(false);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        setDisplayedSteps((prev) => [...prev, steps[currentIndex]]);
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 300); // Show a new step every 300ms

    return () => clearInterval(interval);
  }, [children, isStreaming]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="thinking-process my-4 p-4 thinking-glow rounded-lg shadow-sm border border-codinit-elements-glow-thinking-base transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`i-ph:lightbulb-duotone text-xl ${isComplete ? 'text-codinit-elements-glow-thinking-secondary' : 'text-codinit-elements-glow-thinking-primary animate-pulse'}`}
        />
        {isComplete ? (
          <span className="text-sm font-semibold text-codinit-elements-glow-thinking-secondary">Reasoning Process</span>
        ) : (
          <TextShimmer
            as="span"
            className="text-sm font-semibold text-codinit-elements-glow-thinking-secondary"
            duration={2}
            spread={1.5}
          >
            Thinking...
          </TextShimmer>
        )}
        {!isComplete && (
          <div className="flex gap-1 ml-2">
            <span
              className="w-1.5 h-1.5 bg-codinit-elements-glow-thinking-primary rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 bg-codinit-elements-glow-thinking-primary rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 bg-codinit-elements-glow-thinking-primary rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        {displayedSteps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 group animate-in fade-in slide-in-from-left-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full text-codinit-elements-textPrimary text-xs font-bold flex items-center justify-center mt-0.5 transition-all duration-300 ${
                isComplete
                  ? 'bg-codinit-elements-glow-thinking-secondary'
                  : index === displayedSteps.length - 1
                    ? 'bg-codinit-elements-glow-thinking-primary animate-pulse'
                    : 'bg-codinit-elements-glow-thinking-secondary'
              }`}
            >
              {isComplete || index < displayedSteps.length - 1 ? (
                index + 1
              ) : (
                <div className="i-ph:circle-notch-bold animate-spin text-sm" />
              )}
            </div>
            <div className="flex-1 text-sm text-codinit-elements-textPrimary leading-relaxed pt-0.5">
              {!isComplete && index === displayedSteps.length - 1 ? (
                <TextShimmer as="span" duration={2.5} spread={2}>
                  {step}
                </TextShimmer>
              ) : (
                step
              )}
            </div>
          </div>
        ))}
        {!isComplete && displayedSteps.length < steps.length && (
          <div className="flex items-start gap-3 opacity-40">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-codinit-elements-bg-depth-3 text-codinit-elements-textTertiary text-xs font-bold flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-codinit-elements-textTertiary/50 animate-pulse" />
            </div>
            <div className="flex-1 text-sm text-codinit-elements-textSecondary leading-relaxed pt-0.5 italic">
              Processing next step...
            </div>
          </div>
        )}
      </div>
      {isComplete && (
        <div className="mt-3 pt-3 border-t border-codinit-elements-glow-thinking-base flex items-center gap-2 text-xs text-codinit-elements-glow-thinking-secondary animate-in fade-in duration-500">
          <div className="i-ph:check-circle-duotone text-base" />
          <span>Analysis complete</span>
        </div>
      )}
    </div>
  );
});
