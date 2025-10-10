import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui';

interface DiscussModeProps {
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
}

export function DiscussMode({ chatMode, setChatMode }: DiscussModeProps) {
  return (
    <IconButton
      title="Discuss"
      className={classNames(
        'transition-all flex items-center gap-1 px-1.5',
        chatMode === 'discuss'
          ? '!bg-codinit-elements-item-backgroundAccent !text-codinit-elements-item-contentAccent'
          : 'bg-codinit-elements-item-backgroundDefault text-codinit-elements-item-contentDefault',
      )}
      onClick={() => {
        setChatMode?.(chatMode === 'discuss' ? 'build' : 'discuss');
      }}
    >
      <div className={`i-ph:chats text-xl`} />
      {chatMode === 'discuss' ? <span>Discuss</span> : <span />}
    </IconButton>
  );
}
