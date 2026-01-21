import { atom } from 'nanostores';

export enum ContainerBootState {
  BOOTING = 'booting',
  READY = 'ready',
}

export const containerBootStatus = atom<ContainerBootState>(ContainerBootState.BOOTING);

export function waitForContainerBootState(state: ContainerBootState) {
  return new Promise<void>((resolve) => {
    if (containerBootStatus.get() === state) {
      resolve();
      return;
    }

    const unsubscribe = containerBootStatus.subscribe((value) => {
      if (value === state) {
        unsubscribe();
        resolve();
      }
    });
  });
}
