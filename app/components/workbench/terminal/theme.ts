import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--codinit-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--codinit-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--codinit-elements-terminal-textColor'),
    background: cssVar('--codinit-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--codinit-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--codinit-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--codinit-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--codinit-elements-terminal-color-black'),
    red: cssVar('--codinit-elements-terminal-color-red'),
    green: cssVar('--codinit-elements-terminal-color-green'),
    yellow: cssVar('--codinit-elements-terminal-color-yellow'),
    blue: cssVar('--codinit-elements-terminal-color-blue'),
    magenta: cssVar('--codinit-elements-terminal-color-magenta'),
    cyan: cssVar('--codinit-elements-terminal-color-cyan'),
    white: cssVar('--codinit-elements-terminal-color-white'),
    brightBlack: cssVar('--codinit-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--codinit-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--codinit-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--codinit-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--codinit-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--codinit-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--codinit-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--codinit-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
