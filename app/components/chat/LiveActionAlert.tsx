import { useStore } from '@nanostores/react';
import { memo, useEffect, useRef } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';

export const LiveActionAlert = memo(() => {
  const alert = useStore(workbenchStore.actionAlert);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current && alert?.isStreaming) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [alert?.streamingOutput]);

  if (!alert || !alert.isStreaming) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 w-96 max-h-80 bg-codinit-elements-background-depth-1
                   border border-codinit-elements-borderColor rounded-lg shadow-2xl z-50
                   flex flex-col overflow-hidden"
      >
        <div className="p-3 border-b border-codinit-elements-borderColor flex items-center justify-between bg-codinit-elements-background-depth-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="flex-shrink-0"
            >
              <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-lg" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-codinit-elements-textPrimary truncate">{alert.title}</div>
              {alert.command && (
                <div className="text-xs text-codinit-elements-textSecondary truncate font-mono">{alert.command}</div>
              )}
            </div>
          </div>
          <button
            onClick={() => workbenchStore.actionAlert.set(undefined)}
            className={classNames(
              'flex-shrink-0 ml-2 p-1 rounded hover:bg-codinit-elements-background-depth-3',
              'text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
              'transition-colors',
            )}
            title="Close"
          >
            <div className="i-ph:x text-sm" />
          </button>
        </div>

        <div
          ref={outputRef}
          className="flex-1 p-3 overflow-y-auto overflow-x-hidden font-mono text-xs
                     text-codinit-elements-textPrimary bg-codinit-elements-background-depth-1
                     scrollbar-thin scrollbar-thumb-codinit-elements-borderColor
                     scrollbar-track-transparent"
        >
          <pre className="whitespace-pre-wrap break-words">{alert.streamingOutput || alert.content}</pre>
        </div>

        {alert.progress !== undefined && alert.progress >= 0 && (
          <div className="p-2 border-t border-codinit-elements-borderColor bg-codinit-elements-background-depth-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-codinit-elements-textSecondary">Progress</span>
              <span className="text-xs font-medium text-codinit-elements-textPrimary">
                {Math.round(alert.progress)}%
              </span>
            </div>
            <div className="h-1 bg-codinit-elements-background-depth-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${alert.progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

LiveActionAlert.displayName = 'LiveActionAlert';
