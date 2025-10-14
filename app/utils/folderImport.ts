import type { Message } from 'ai';
import { initFromFolder } from '~/lib/services/projectInit';

export const createChatFromFolder = async (
  files: File[],
  binaryFiles: string[],
  folderName: string,
): Promise<Message[]> => {
  const { messages } = await initFromFolder({
    files,
    binaryFiles,
    folderName,
  });

  return messages;
};
