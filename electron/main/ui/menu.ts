import { Menu } from 'electron';

export function setupMenu(): void {
  // Remove the application menu entirely to hide menu bar on all platforms
  Menu.setApplicationMenu(null);
}
