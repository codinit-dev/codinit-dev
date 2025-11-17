import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import { SlideContent } from './slide-content';

interface ActionItem {
  id: string;
  action: string;
  target: string;
  timestamp: number;
}

interface ActionsDropdownProps {
  actions: ActionItem[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ActionsDropdown({ actions, isOpen, onToggle, className }: ActionsDropdownProps) {
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
      >
        <span>{actions.length} actions taken</span>
        <div className={cn('i-ph:caret-down-bold transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && actions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-2 max-h-64 overflow-y-auto border border-codinit-elements-borderColor rounded-md bg-codinit-elements-background-depth-1 shadow-lg"
          >
            <div className="py-1">
              {actions
                .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
                .map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SlideContent action={action.action} target={action.target} />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
