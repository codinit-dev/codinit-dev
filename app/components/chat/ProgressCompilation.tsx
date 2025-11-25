import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import type { ProgressAnnotation } from '~/types/context';
import { TextShimmer } from '~/components/ui/text-shimmer';

export default function ProgressCompilation({ data }: { data?: ProgressAnnotation[] }) {
  const [progressList, setProgressList] = React.useState<ProgressAnnotation[]>([]);

  React.useEffect(() => {
    if (!data || data.length == 0) {
      setProgressList([]);
      return;
    }

    const progressMap = new Map<string, ProgressAnnotation>();
    data.forEach((x) => {
      const existingProgress = progressMap.get(x.label);

      if (existingProgress && existingProgress.status === 'complete') {
        return;
      }

      progressMap.set(x.label, x);
    });

    const newData = Array.from(progressMap.values());
    newData.sort((a, b) => a.order - b.order);
    setProgressList(newData);
  }, [data]);

  if (progressList.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <ProgressItem progress={progressList[progressList.length - 1]} />
    </AnimatePresence>
  );
}

const ProgressItem = ({ progress }: { progress: ProgressAnnotation }) => {
  return (
    <motion.div
      className="flex items-center gap-1.5 text-sm w-full max-w-chat mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div>
        {progress.status === 'in-progress' ? (
          <div className="i-svg-spinners:90-ring-with-bg"></div>
        ) : progress.status === 'complete' ? (
          <div className="i-ph:check"></div>
        ) : null}
      </div>
      {progress.status === 'in-progress' ? (
        <TextShimmer className="font-medium" duration={1.5}>
          {progress.message}
        </TextShimmer>
      ) : (
        <span>{progress.message}</span>
      )}
    </motion.div>
  );
};
