import { useCallback, useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useMCPStore } from '~/lib/stores/mcp';
import { shouldShowAutocomplete, calculateDropdownPosition, detectReferenceType } from '~/utils/toolMentionParser';
import type { FileMap } from '~/lib/stores/files';
import { WORK_DIR } from '~/utils/constants';

export interface ToolItem {
  name: string;
  description: string;
  serverName: string;
  inputSchema?: Record<string, any>;
}

export interface FileItem {
  name: string;
  path: string;
  relativePath: string;
  type: 'file';
}

export interface CommandItem {
  name: string;
  description: string;
  icon: string;
  action: 'agent-mode' | 'mcp-tool';
  type: 'command';
}

interface UseToolMentionAutocompleteOptions {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  onToolSelected: (toolName: string) => void;
  onFileSelected?: (filePath: string) => void;
  onCommandSelected?: (command: CommandItem) => void;
  files?: FileMap;
}

export type ReferenceItem = ToolItem | FileItem | CommandItem;

interface UseToolMentionAutocompleteReturn {
  isOpen: boolean;
  searchQuery: string;
  filteredTools: ToolItem[];
  filteredFiles: FileItem[];
  filteredCommands: CommandItem[];
  selectedIndex: number;
  dropdownPosition: { x: number; y: number } | null;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  handleToolSelect: (toolName: string) => void;
  handleFileSelect: (filePath: string) => void;
  handleCommandSelect: (command: CommandItem) => void;
  handleClose: () => void;
  setSelectedIndex: (index: number) => void;
  referenceType: 'file' | 'tool';
}

function getAvailableTools(serverTools: Record<string, any>, selectedMCP: string | null): ToolItem[] {
  const tools: ToolItem[] = [];

  Object.entries(serverTools).forEach(([serverName, serverData]) => {
    if (serverData.status !== 'available') {
      return;
    }

    if (selectedMCP && serverName !== selectedMCP) {
      return;
    }

    const serverToolsData = serverData.tools || {};

    Object.entries(serverToolsData).forEach(([toolName, toolData]: [string, any]) => {
      tools.push({
        name: toolName,
        description: toolData.description || '',
        serverName,
        inputSchema: toolData.parameters,
      });
    });
  });

  return tools;
}

function fuzzyFilterTools(tools: ToolItem[], query: string): ToolItem[] {
  if (!query) {
    return tools;
  }

  const fuse = new Fuse(tools, {
    keys: ['name', 'description'],
    threshold: 0.3,
    distance: 100,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.map((result) => result.item);
}

function getAvailableFiles(files?: FileMap): FileItem[] {
  if (!files) {
    return [];
  }

  const fileItems: FileItem[] = [];
  const workDir = WORK_DIR;

  Object.entries(files).forEach(([path, dirent]) => {
    if (dirent?.type === 'file') {
      const relativePath = path.startsWith(workDir) ? path.slice(workDir.length + 1) : path;
      const name = relativePath.split('/').pop() || relativePath;

      fileItems.push({
        name,
        path,
        relativePath,
        type: 'file',
      });
    }
  });

  return fileItems;
}

function fuzzyFilterFiles(files: FileItem[], query: string): FileItem[] {
  if (!query) {
    return files.slice(0, 50);
  }

  const fuse = new Fuse(files, {
    keys: ['relativePath', 'name'],
    threshold: 0.4,
    distance: 200,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.map((result) => result.item).slice(0, 50);
}

function getAvailableCommands(): CommandItem[] {
  return [
    {
      name: 'agent',
      description: 'Enable autonomous agent mode with Plan-Execute reasoning for complex tasks',
      icon: 'i-ph:robot-fill',
      action: 'agent-mode',
      type: 'command',
    },
  ];
}

function fuzzyFilterCommands(commands: CommandItem[], query: string): CommandItem[] {
  if (!query) {
    return commands;
  }

  const fuse = new Fuse(commands, {
    keys: ['name', 'description'],
    threshold: 0.3,
    distance: 100,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.map((result) => result.item);
}

export function useToolMentionAutocomplete(
  options: UseToolMentionAutocompleteOptions,
): UseToolMentionAutocompleteReturn {
  const { input, textareaRef, onToolSelected, onFileSelected, onCommandSelected, files } = options;

  const serverTools = useMCPStore((state) => state.serverTools);
  const selectedMCP = useMCPStore((state) => state.selectedMCP);

  const autocompleteState = useMemo(() => {
    const cursorPos = textareaRef?.current?.selectionStart || 0;

    return shouldShowAutocomplete(input, cursorPos);
  }, [input, textareaRef]);

  const { isOpen, searchQuery, atPosition } = autocompleteState;

  const referenceType = useMemo(() => {
    return detectReferenceType(searchQuery);
  }, [searchQuery]);

  const availableTools = useMemo(() => {
    return getAvailableTools(serverTools, selectedMCP);
  }, [serverTools, selectedMCP]);

  const availableFiles = useMemo(() => {
    return getAvailableFiles(files);
  }, [files]);

  const availableCommands = useMemo(() => {
    return getAvailableCommands();
  }, []);

  const filteredTools = useMemo(() => {
    if (referenceType === 'file') {
      return [];
    }

    return fuzzyFilterTools(availableTools, searchQuery);
  }, [availableTools, searchQuery, referenceType]);

  const filteredFiles = useMemo(() => {
    if (referenceType === 'tool') {
      return [];
    }

    return fuzzyFilterFiles(availableFiles, searchQuery);
  }, [availableFiles, searchQuery, referenceType]);

  const filteredCommands = useMemo(() => {
    if (referenceType === 'file') {
      return [];
    }

    return fuzzyFilterCommands(availableCommands, searchQuery);
  }, [availableCommands, searchQuery, referenceType]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const dropdownPosition = useMemo(() => {
    if (!isOpen || !textareaRef?.current) {
      return null;
    }

    return calculateDropdownPosition(textareaRef.current, atPosition);
  }, [isOpen, textareaRef, atPosition]);

  const handleClose = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const handleToolSelect = useCallback(
    (toolName: string) => {
      onToolSelected(toolName);
      handleClose();
    },
    [onToolSelected, handleClose],
  );

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (onFileSelected) {
        onFileSelected(filePath);
      }

      handleClose();
    },
    [onFileSelected, handleClose],
  );

  const handleCommandSelect = useCallback(
    (command: CommandItem) => {
      if (onCommandSelected) {
        onCommandSelected(command);
      }

      handleClose();
    },
    [onCommandSelected, handleClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      const allItems = referenceType === 'file' ? filteredFiles : [...filteredCommands, ...filteredTools];

      if (!isOpen || allItems.length === 0) {
        return false;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return true;

        case 'Enter':
        case 'Tab':
          if (allItems[selectedIndex]) {
            e.preventDefault();

            if (referenceType === 'file') {
              handleFileSelect((allItems[selectedIndex] as FileItem).relativePath);
            } else {
              const selectedItem = allItems[selectedIndex];

              if ('type' in selectedItem && selectedItem.type === 'command') {
                handleCommandSelect(selectedItem as CommandItem);
              } else {
                handleToolSelect((selectedItem as ToolItem).name);
              }
            }

            return true;
          }

          return false;

        case 'Escape':
          e.preventDefault();
          handleClose();
          return true;

        default:
          return false;
      }
    },
    [
      isOpen,
      filteredTools,
      filteredFiles,
      filteredCommands,
      selectedIndex,
      handleToolSelect,
      handleFileSelect,
      handleCommandSelect,
      handleClose,
      referenceType,
    ],
  );

  return {
    isOpen,
    searchQuery,
    filteredTools,
    filteredFiles,
    filteredCommands,
    selectedIndex,
    dropdownPosition,
    handleKeyDown,
    handleToolSelect,
    handleFileSelect,
    handleCommandSelect,
    handleClose,
    setSelectedIndex,
    referenceType,
  };
}
