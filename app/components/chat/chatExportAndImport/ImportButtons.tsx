import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';

type ChatData = {
  messages?: Message[]; // Standard codinit format
  description?: string; // Optional description
};

export function ImportButtons(importChat: ((description: string, messages: Message[]) => Promise<void>) | undefined) {
  return (
    <>
      <input
        type="file"
        id="chat-import"
        className="hidden"
        accept=".json"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file && importChat) {
            try {
              const reader = new FileReader();

              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  const data = JSON.parse(content) as ChatData;

                  // Standard format
                  if (Array.isArray(data.messages)) {
                    await importChat(data.description || 'Imported Chat', data.messages);
                    toast.success('Chat imported successfully');

                    return;
                  }

                  toast.error('Invalid chat file format');
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    toast.error('Failed to parse chat file: ' + error.message);
                  } else {
                    toast.error('Failed to parse chat file');
                  }
                }
              };
              reader.onerror = () => toast.error('Failed to read chat file');
              reader.readAsText(file);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to import chat');
            }
            e.target.value = ''; // Reset file input
          } else {
            toast.error('Something went wrong');
          }
        }}
      />
      <Button
        onClick={() => {
          const input = document.getElementById('chat-import');
          input?.click();
        }}
        variant="default"
        size="lg"
        className={classNames(
          'group relative gap-2.5 bg-gradient-to-br from-codinit-elements-background-depth-1 to-codinit-elements-background-depth-2',
          'text-codinit-elements-textPrimary font-medium',
          'hover:from-codinit-elements-background-depth-2 hover:to-codinit-elements-background-depth-3',
          'border border-codinit-elements-borderColor/60 hover:border-accent-500/40',
          'shadow-md hover:shadow-lg hover:shadow-accent-500/10',
          'h-11 px-5 py-2.5 min-w-[140px] justify-center',
          'rounded-xl transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
        )}
      >
        <span className="i-ph:file-arrow-up-duotone w-5 h-5 text-accent-500 group-hover:scale-110 transition-transform" />
        Import Chat
      </Button>
      <ImportFolderButton
        importChat={importChat}
        className={classNames(
          'group relative gap-2.5 bg-gradient-to-br from-codinit-elements-background-depth-1 to-codinit-elements-background-depth-2',
          'text-codinit-elements-textPrimary font-medium',
          'hover:from-codinit-elements-background-depth-2 hover:to-codinit-elements-background-depth-3',
          'border border-codinit-elements-borderColor/60 hover:border-green-500/40',
          'shadow-md hover:shadow-lg hover:shadow-green-500/10',
          'h-11 px-5 py-2.5 min-w-[140px] justify-center',
          'rounded-xl transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
        )}
      />
    </>
  );
}
