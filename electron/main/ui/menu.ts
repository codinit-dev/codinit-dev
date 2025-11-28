import { BrowserWindow, Menu } from 'electron';

export function setupMenu(_win: BrowserWindow): void {
  Menu.setApplicationMenu(null);
}
