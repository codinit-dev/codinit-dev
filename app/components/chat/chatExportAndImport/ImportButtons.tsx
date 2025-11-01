import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';

type ChatData = {
  messages?: Message[]; // Standard Example format
  description?: string; // Optional description
};

export function ImportButtons(importChat: ((description: string, messages: Message[]) => Promise<void>) | undefined) {
  return (
    <div className="flex flex-col items-center justify-center w-auto">
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
      <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
        <div className="flex gap-2">
          <button
            onClick={() => {
              const input = document.getElementById('chat-import');
              input?.click();
            }}
            aria-label="Import Chat"
            title="Import Chat"
            className="flex items-center gap-1.5 border border-codinit-elements-borderColor rounded-full px-3 py-1.5 text-xs transition-theme text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <span className="w-4 h-4 block transition-theme i-ph:upload-simple" />
            <span className="transition-theme">Import Chat</span>
          </button>
          <ImportFolderButton importChat={importChat} />
        </div>
      </div>
    </div>
  );
}
