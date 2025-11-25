import { atom, computed } from 'nanostores';
import type { DesignScheme, ColorMode, ColorPalette } from '~/types/design-scheme';
import { defaultDesignScheme, getBorderRadiusValue, getBoxShadowValue, getSpacingValue } from '~/types/design-scheme';

export const designSchemeStore = atom<DesignScheme>(defaultDesignScheme);

export function updateDesignScheme(scheme: DesignScheme) {
  designSchemeStore.set(scheme);
}

export function updatePalette(mode: ColorMode, palette: Partial<ColorPalette>) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    palette: {
      ...current.palette,
      [mode]: {
        ...current.palette[mode],
        ...palette,
      },
    },
  });
}

export function updateColorMode(mode: ColorMode) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    mode,
  });
}

export function updateFeatures(features: string[]) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    features,
  });
}

export function toggleFeature(feature: string) {
  const current = designSchemeStore.get();
  const features = current.features.includes(feature)
    ? current.features.filter((f) => f !== feature)
    : [...current.features, feature];

  designSchemeStore.set({
    ...current,
    features,
  });
}

export function updateFonts(fonts: string[]) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    font: fonts,
  });
}

export function updateBorderRadius(borderRadius: string) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    borderRadius,
  });
}

export function updateShadow(shadow: string) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    shadow,
  });
}

export function updateSpacing(spacing: string) {
  const current = designSchemeStore.get();
  designSchemeStore.set({
    ...current,
    spacing,
  });
}

export function resetToDefault() {
  designSchemeStore.set(defaultDesignScheme);
}

export const currentPalette = computed(designSchemeStore, (scheme) => {
  return scheme.palette[scheme.mode];
});

export const computedBorderRadius = computed(designSchemeStore, (scheme) => {
  return getBorderRadiusValue(scheme.borderRadius, scheme.features.includes('rounded'));
});

export const computedBoxShadow = computed(designSchemeStore, (scheme) => {
  return getBoxShadowValue(scheme.shadow, scheme.features.includes('shadow'));
});

export const computedSpacing = computed(designSchemeStore, (scheme) => {
  return getSpacingValue(scheme.spacing);
});

export const fontFamily = computed(designSchemeStore, (scheme) => {
  return scheme.font.join(', ');
});
