export function BuiltWithCodinitBadge() {
  return (
    <a
      href="https://codinit.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2
                 bg-white text-black
                 border border-gray-300
                 hover:bg-gray-50
                 rounded-lg shadow-sm
                 transition-colors duration-150
                 text-xs font-medium"
      aria-label="Built with CodinIT"
    >
      <img src="/icon-light.png" alt="CodinIT" width="16" height="16" className="flex-shrink-0" />
      <span className="hidden md:inline whitespace-nowrap">Built with CodinIT</span>
    </a>
  );
}
