import { atom } from 'nanostores';
import type { DesignScheme } from '~/types/design-scheme';
import { defaultDesignScheme } from '~/types/design-scheme';

export const designSchemeStore = atom<DesignScheme>(defaultDesignScheme);

export function updateDesignScheme(scheme: DesignScheme) {
  designSchemeStore.set(scheme);
}
