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

interface UseToolMentionAutocompleteOptions {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  onToolSelected: (toolName: string) => void;
  onFileSelected?: (filePath: string) => void;
  files?: FileMap;
}

export type ReferenceItem = ToolItem | FileItem;

interface UseToolMentionAutocompleteReturn {
  isOpen: boolean;
  searchQuery: string;
  filteredTools: ToolItem[];
  filteredFiles: FileItem[];
  selectedIndex: number;
  dropdownPosition: { x: number; y: number } | null;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  handleToolSelect: (toolName: string) => void;
  handleFileSelect: (filePath: string) => void;
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

export function useToolMentionAutocomplete(
  options: UseToolMentionAutocompleteOptions,
): UseToolMentionAutocompleteReturn {
  const { input, textareaRef, onToolSelected, onFileSelected, files } = options;

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      const items = referenceType === 'file' ? filteredFiles : filteredTools;

      if (!isOpen || items.length === 0) {
        return false;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return true;

        case 'Enter':
        case 'Tab':
          if (items[selectedIndex]) {
            e.preventDefault();

            if (referenceType === 'file') {
              handleFileSelect((items[selectedIndex] as FileItem).relativePath);
            } else {
              handleToolSelect((items[selectedIndex] as ToolItem).name);
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
      selectedIndex,
      handleToolSelect,
      handleFileSelect,
      handleClose,
      referenceType,
    ],
  );

  return {
    isOpen,
    searchQuery,
    filteredTools,
    filteredFiles,
    selectedIndex,
    dropdownPosition,
    handleKeyDown,
    handleToolSelect,
    handleFileSelect,
    handleClose,
    setSelectedIndex,
    referenceType,
  };
}
