export interface AutocompleteState {
  isOpen: boolean;
  searchQuery: string;
  atPosition: number;
}

export function shouldShowAutocomplete(text: string, cursorPos: number): AutocompleteState {
  const textBeforeCursor = text.slice(0, cursorPos);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) {
    return { isOpen: false, searchQuery: '', atPosition: -1 };
  }

  const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

  if (textAfterAt.includes(' ')) {
    return { isOpen: false, searchQuery: '', atPosition: -1 };
  }

  if (lastAtIndex > 0 && !/\s/.test(text[lastAtIndex - 1])) {
    return { isOpen: false, searchQuery: '', atPosition: -1 };
  }

  return {
    isOpen: true,
    searchQuery: textAfterAt,
    atPosition: lastAtIndex,
  };
}

export function extractSearchQuery(text: string, cursorPos: number): string {
  const state = shouldShowAutocomplete(text, cursorPos);
  return state.searchQuery;
}

export function calculateDropdownPosition(
  textarea: HTMLTextAreaElement,
  atPosition: number,
): { x: number; y: number } | null {
  if (!textarea) {
    return null;
  }

  const text = textarea.value.slice(0, atPosition);
  const lines = text.split('\n');
  const currentLine = lines.length - 1;
  const currentColumn = lines[lines.length - 1].length;

  const style = window.getComputedStyle(textarea);
  const fontSize = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingTop = parseFloat(style.paddingTop);

  const charWidth = fontSize * 0.6;

  const rect = textarea.getBoundingClientRect();
  const x = rect.left + paddingLeft + currentColumn * charWidth;
  const y = rect.top + paddingTop + (currentLine + 1) * lineHeight;

  return { x, y };
}

export function insertToolMention(
  text: string,
  cursorPos: number,
  toolName: string,
): { newText: string; newCursorPos: number } {
  const state = shouldShowAutocomplete(text, cursorPos);

  if (!state.isOpen) {
    return { newText: text, newCursorPos: cursorPos };
  }

  const beforeAt = text.slice(0, state.atPosition);
  const afterCursor = text.slice(cursorPos);
  const newText = `${beforeAt}@${toolName} ${afterCursor}`;
  const newCursorPos = state.atPosition + toolName.length + 2;

  return { newText, newCursorPos };
}
