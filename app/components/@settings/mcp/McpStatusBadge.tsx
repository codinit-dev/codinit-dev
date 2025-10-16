import { useMemo } from 'react';

export default function McpStatusBadge({ status }: { status: 'checking' | 'available' | 'unavailable' }) {
  const { styles, label, icon, ariaLabel } = useMemo(() => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors';

    const config = {
      checking: {
        styles: `${base} bg-accent-100 text-accent-800 dark:bg-accent-900/80 dark:text-accent-200`,
        label: 'Checking...',
        ariaLabel: 'Checking server status',
        icon: <span className="i-svg-spinners:90-ring-with-bg w-3 h-3 text-current animate-spin" aria-hidden="true" />,
      },
      available: {
        styles: `${base} bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300`,
        label: 'Available',
        ariaLabel: 'Server available',
        icon: <span className="i-ph:check-circle w-3 h-3 text-current" aria-hidden="true" />,
      },
      unavailable: {
        styles: `${base} bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300`,
        label: 'Unavailable',
        ariaLabel: 'Server unavailable',
        icon: <span className="i-ph:warning-circle w-3 h-3 text-current" aria-hidden="true" />,
      },
    };

    return config[status];
  }, [status]);

  return (
    <span className={styles} role="status" aria-live="polite" aria-label={ariaLabel}>
      {icon}
      {label}
    </span>
  );
}
