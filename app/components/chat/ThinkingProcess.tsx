import { memo } from 'react';

interface ThinkingProcessProps {
  children: React.ReactNode;
}

export const ThinkingProcess = memo(({ children }: ThinkingProcessProps) => {
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

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="thinking-process my-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="i-ph:lightbulb-duotone text-xl text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Reasoning Process</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3 group">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {index + 1}codinit
            </div>
            <div className="flex-1 text-sm text-codinit-elements-textPrimary leading-relaxed pt-0.5">{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
});
