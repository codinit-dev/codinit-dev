import { useCallback, useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useMCPStore } from '~/lib/stores/mcp';
import { shouldShowAutocomplete, calculateDropdownPosition } from '~/utils/toolMentionParser';

export interface ToolItem {
  name: string;
  description: string;
  serverName: string;
  inputSchema?: Record<string, any>;
}

interface UseToolMentionAutocompleteOptions {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  onToolSelected: (toolName: string) => void;
}

interface UseToolMentionAutocompleteReturn {
  isOpen: boolean;
  searchQuery: string;
  filteredTools: ToolItem[];
  selectedIndex: number;
  dropdownPosition: { x: number; y: number } | null;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  handleToolSelect: (toolName: string) => void;
  handleClose: () => void;
  setSelectedIndex: (index: number) => void;
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

export function useToolMentionAutocomplete(
  options: UseToolMentionAutocompleteOptions,
): UseToolMentionAutocompleteReturn {
  const { input, textareaRef, onToolSelected } = options;

  const serverTools = useMCPStore((state) => state.serverTools);
  const selectedMCP = useMCPStore((state) => state.selectedMCP);

  const autocompleteState = useMemo(() => {
    const cursorPos = textareaRef?.current?.selectionStart || 0;

    return shouldShowAutocomplete(input, cursorPos);
  }, [input, textareaRef]);

  const { isOpen, searchQuery, atPosition } = autocompleteState;

  const availableTools = useMemo(() => {
    return getAvailableTools(serverTools, selectedMCP);
  }, [serverTools, selectedMCP]);

  const filteredTools = useMemo(() => {
    return fuzzyFilterTools(availableTools, searchQuery);
  }, [availableTools, searchQuery]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isOpen || filteredTools.length === 0) {
        return false;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredTools.length - 1));
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return true;

        case 'Enter':
        case 'Tab':
          if (filteredTools[selectedIndex]) {
            e.preventDefault();
            handleToolSelect(filteredTools[selectedIndex].name);

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
    [isOpen, filteredTools, selectedIndex, handleToolSelect, handleClose],
  );

  return {
    isOpen,
    searchQuery,
    filteredTools,
    selectedIndex,
    dropdownPosition,
    handleKeyDown,
    handleToolSelect,
    handleClose,
    setSelectedIndex,
  };
}
