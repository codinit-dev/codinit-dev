import { useEffect, useState } from 'react';

const EXAMPLE_PROMPTS = [
  'Build a modern landing page with React and Tailwind...',
  'Create a todo app with dark mode support...',
  'Design a dashboard with charts and analytics...',
  'Make a responsive portfolio website...',
  'Build an e-commerce product page...',
  'Create a blog with markdown support...',
];

interface TypingAnimationProps {
  onPromptClick?: (prompt: string) => void;
}

export function TypingAnimation({ onPromptClick: _onPromptClick }: TypingAnimationProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentPrompt = EXAMPLE_PROMPTS[currentPromptIndex];

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting && displayedText === currentPrompt) {
      setIsPaused(true);
      return undefined;
    }

    if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentPromptIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);

      return undefined;
    }

    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setDisplayedText(currentPrompt.substring(0, displayedText.length - 1));
        } else {
          setDisplayedText(currentPrompt.substring(0, displayedText.length + 1));
        }
      },
      isDeleting ? 30 : 50,
    );

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, isPaused, currentPromptIndex]);

  return (
    <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
      <div className="flex items-center gap-2 text-bolt-elements-textTertiary text-sm transition-theme">
        <span>{displayedText}</span>
        <span className="inline-block w-0.5 h-4 bg-accent-400 animate-pulse transition-theme" />
      </div>
    </div>
  );
}
