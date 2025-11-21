import { atom } from 'nanostores';
import type { DesignScheme } from '~/types/design-scheme';
import { defaultDesignScheme } from '~/types/design-scheme';

export const kDesignScheme = 'codinit_design_scheme';

export const designSchemeStore = atom<DesignScheme>(initStore());

function initStore(): DesignScheme {
  if (!import.meta.env.SSR) {
    const persistedScheme = localStorage.getItem(kDesignScheme);

    if (persistedScheme) {
      try {
        return { ...defaultDesignScheme, ...JSON.parse(persistedScheme) };
      } catch (error) {
        console.error('Error parsing saved design scheme:', error);
      }
    }
  }

  return defaultDesignScheme;
}

export function updateDesignScheme(scheme: DesignScheme) {
  designSchemeStore.set(scheme);
  localStorage.setItem(kDesignScheme, JSON.stringify(scheme));
}
