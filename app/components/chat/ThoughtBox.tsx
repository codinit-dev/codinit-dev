import { useState, type PropsWithChildren } from 'react';

const ThoughtBox = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        thought-box
        border border-codinit-elements-artifacts-borderColor 
        bg-codinit-elements-artifacts-background
        rounded-xl 
        shadow-sm
        overflow-hidden
        transition-all 
        duration-300
        ${isExpanded ? 'ring-1 ring-codinit-elements-borderColorActive' : ''}
      `}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-codinit-elements-artifacts-backgroundHover transition-colors"
      >
        <div className={`p-1.5 rounded-md ${isExpanded ? 'bg-codinit-elements-button-primary-background text-codinit-elements-button-primary-text' : 'bg-codinit-elements-artifacts-inlineCode-background text-codinit-elements-textSecondary'}`}>
          <div className="i-ph:brain-thin text-lg" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-codinit-elements-textPrimary">{title}</div>
          {!isExpanded && (
            <div className="text-xs text-codinit-elements-textTertiary mt-0.5">Click to view reasoning</div>
          )}
        </div>
        <div className={`text-codinit-elements-textTertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <div className="i-ph:caret-down-bold" />
        </div>
      </button>

      <div
        className={`
          transition-all 
          duration-300
          ease-out
          overflow-hidden
          ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-codinit-elements-artifacts-borderColor' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="p-4 text-sm text-codinit-elements-textSecondary bg-codinit-elements-actions-background leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ThoughtBox;
