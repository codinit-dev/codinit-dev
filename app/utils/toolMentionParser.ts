export interface AutocompleteState {
  isOpen: boolean;
  searchQuery: string;
  atPosition: number;
}

export type ReferenceType = 'file' | 'tool';

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

export function detectReferenceType(searchQuery: string): ReferenceType {
  return /[\/\.]/.test(searchQuery) ? 'file' : 'tool';
}

function getTextWidth(text: string, font: string): number {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return text.length * 8;
  }

  context.font = font;

  return context.measureText(text).width;
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
  const textBeforeCursor = lines[lines.length - 1];

  const style = window.getComputedStyle(textarea);
  const fontSize = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingTop = parseFloat(style.paddingTop);
  const font = `${style.fontSize} ${style.fontFamily}`;

  const textWidth = getTextWidth(textBeforeCursor, font);

  const rect = textarea.getBoundingClientRect();
  const x = rect.left + paddingLeft + textWidth - textarea.scrollLeft;
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

export function insertFileReference(
  text: string,
  cursorPos: number,
  filePath: string,
): { newText: string; newCursorPos: number } {
  const state = shouldShowAutocomplete(text, cursorPos);

  if (!state.isOpen) {
    return { newText: text, newCursorPos: cursorPos };
  }

  const beforeAt = text.slice(0, state.atPosition);
  const afterCursor = text.slice(cursorPos);
  const newText = `${beforeAt}@${filePath} ${afterCursor}`;
  const newCursorPos = state.atPosition + filePath.length + 2;

  return { newText, newCursorPos };
}
