export function BuiltWithCodinitBadge() {
  return (
    <a
      href="https://codinit.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2
                 bg-blue-50 dark:bg-blue-500/10
                 text-blue-700 dark:text-blue-300
                 border border-blue-200 dark:border-blue-500/30
                 hover:bg-blue-100 dark:hover:bg-blue-500/20
                 rounded-lg shadow-sm
                 transition-colors duration-150
                 text-xs font-medium
                 backdrop-blur-sm"
      aria-label="Built with CodinIT"
    >
      <svg
        height="16"
        width="16"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <rect height="16" rx="2" width="16" fill="currentColor" opacity="0.15" />
        <path d="M10 9V13H12V9H10Z" fill="currentColor" />
        <path d="M4 3V13H6V9H10V7H6V5H10V7H12V3H4Z" fill="currentColor" />
      </svg>
      <span className="hidden md:inline whitespace-nowrap">Built with CodinIT</span>
    </a>
  );
}
