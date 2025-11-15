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
    <div className="thinking-artifact border border-codinit-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150 thinking-glow">
      <div className="flex">
        <div className="flex items-stretch bg-codinit-elements-artifacts-background hover:bg-codinit-elements-artifacts-backgroundHover w-full overflow-hidden">
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full thinking-glow-text font-medium leading-5 text-sm">{thinkingArtifact.title}</div>
            <div className="w-full w-full text-codinit-elements-textSecondary text-xs mt-0.5">
              Chain of thought reasoning
            </div>
          </div>
        </div>
        <AnimatePresence>
          <motion.button
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.15, ease: cubicEasingFn }}
            className="bg-codinit-elements-artifacts-background hover:bg-codinit-elements-artifacts-backgroundHover"
            onClick={toggleSteps}
          >
            <div className="p-4">
              <div className={showSteps ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showSteps && thinkingArtifact.steps.length > 0 && (
          <motion.div
            className="steps"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-codinit-elements-artifacts-borderColor h-[1px]" />
            <div className="p-5 text-left bg-codinit-elements-actions-background">
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
              <div className="flex-shrink-0 w-6 h-6 rounded-full building-glow text-white text-xs font-bold flex items-center justify-center mt-0.5 building-glow-text">
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
