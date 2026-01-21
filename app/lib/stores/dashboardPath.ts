import { atom } from 'nanostores';

export const dashboardPathStore = atom<string>('');

export function openDashboardToPath(path: string) {
  dashboardPathStore.set(path);
}
