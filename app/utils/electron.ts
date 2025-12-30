export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

export const saveFileLocal = async (
  projectName: string,
  filePath: string,
  content: string | Uint8Array,
): Promise<boolean> => {
  if (!isElectron()) {
    return false;
  }

  try {
    return await (window as any).electronAPI.saveFileLocal(projectName, filePath, content);
  } catch (error) {
    console.error('Failed to call saveFileLocal:', error);
    return false;
  }
};

export const initializeProject = async (projectName: string): Promise<boolean> => {
  if (!isElectron()) {
    return false;
  }

  try {
    return await (window as any).electronAPI.initializeProject(projectName);
  } catch (error) {
    console.error('Failed to call initializeProject:', error);
    return false;
  }
};
