import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { cubicEasingFn } from '~/utils/easings';

interface ThinkingArtifactProps {
  messageId: string;
}

export const ThinkingArtifact = memo(({ messageId }: ThinkingArtifactProps) => {
  const [showSteps, setShowSteps] = useState(true);

  const thinkingArtifacts = useStore(workbenchStore.thinkingArtifacts);
  const thinkingArtifact = thinkingArtifacts[messageId];

  if (!thinkingArtifact) {
    return null;
  }

  const toggleSteps = () => {
    setShowSteps(!showSteps);
  };

  return (
    <div className="thinking-artifact flex flex-col overflow-hidden rounded-xl border border-codinit-elements-artifacts-borderColor bg-codinit-elements-artifacts-background shadow-sm transition-all duration-200 thinking-glow">
      <div className="flex items-stretch min-h-[56px] bg-codinit-elements-actions-background border-b border-codinit-elements-artifacts-borderColor">
        <div className="flex-1 flex items-center px-5 py-3 text-left">
          <div className="w-full">
            <div className="w-full thinking-glow-text font-medium text-sm leading-5">{thinkingArtifact.title}</div>
            <div className="w-full text-codinit-elements-textTertiary text-xs mt-0.5">Chain of thought reasoning</div>
          </div>
        </div>

        <div className="w-[1px] bg-codinit-elements-artifacts-borderColor my-3" />
        <div className="px-3 flex items-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2 rounded-lg hover:bg-codinit-elements-button-secondary-backgroundHover text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
            onClick={toggleSteps}
          >
            <div className={showSteps ? 'i-ph:caret-up-bold text-lg' : 'i-ph:caret-down-bold text-lg'} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showSteps && thinkingArtifact.steps.length > 0 && (
          <motion.div
            className="steps bg-codinit-elements-artifacts-background"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="p-4 border-t border-codinit-elements-artifacts-borderColor">
              <ThinkingSteps steps={thinkingArtifact.steps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface ThinkingStepsProps {
  steps: string[];
}

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function ThinkingSteps({ steps }: ThinkingStepsProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {steps.map((step, index) => (
          <motion.li
            key={index}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            transition={{
              duration: 0.2,
              ease: cubicEasingFn,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full building-glow text-codinit-elements-textPrimary text-xs font-bold flex items-center justify-center mt-0.5 building-glow-text">
                {index + 1}
              </div>
              <div className="flex-1 text-sm text-codinit-elements-textPrimary leading-relaxed pt-0.5">{step}</div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
