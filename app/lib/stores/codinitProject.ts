import { atom } from 'nanostores';
import type { CodinitProject } from 'codinit-agent/types';

export const codinitProjectStore = atom<CodinitProject | undefined>(undefined);
