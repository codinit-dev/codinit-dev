import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
  onClick?: () => void;
  isInteractive?: boolean;
}

export function AnimatedCounter({
  value,
  className,
  duration = 300,
  onClick,
  isInteractive = false,
}: AnimatedCounterProps) {
  const digits = value.toString().padStart(2, '0').split('');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5',
        isInteractive && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
      onClick={onClick}
    >
      {digits.map((digit, index) => (
        <DigitReel key={`${index}-${value}`} digit={parseInt(digit)} duration={duration} />
      ))}
    </div>
  );
}

interface DigitReelProps {
  digit: number;
  duration: number;
}

function DigitReel({ digit, duration }: DigitReelProps) {
  return (
    <div className="relative inline-block w-[1ch] overflow-y-clip leading-none tabular-nums h-6">
      <div className="invisible">0</div>
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute inset-0 flex items-center justify-center text-sm font-medium"
          initial={{ y: (i - digit) * 24 }} // 24px per digit height
          animate={{ y: (i - digit) * 24 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: duration / 1000,
          }}
        >
          {i}
        </motion.span>
      ))}
    </div>
  );
}
