export type ColorMode = 'light' | 'dark';

export interface ColorPalette {
  [key: string]: string;
}

export interface DesignScheme {
  palette: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  features: string[];
  font: string[];
  mode: ColorMode;
  borderRadius: string;
  shadow: string;
  spacing: string;
  theme?: string;
}

export interface PaletteRole {
  key: string;
  label: string;
  description: string;
}

export interface DesignOption {
  key: string;
  label: string;
}

export interface FontOption extends DesignOption {
  preview: string;
}

export interface ThemePreset extends DesignOption {
  image: string;
}

export interface ColorPreset extends DesignOption {
  value: string;
}

export const defaultDesignScheme: DesignScheme = {
  palette: {
    light: {
      primary: '#7c3aed',
      secondary: '#06b6d4',
      accent: '#ec4899',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      primary: '#9E7FFF',
      secondary: '#38bdf8',
      accent: '#f472b6',
      background: '#171717',
      surface: '#262626',
      text: '#FFFFFF',
      textSecondary: '#A3A3A3',
      border: '#2F2F2F',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  features: ['rounded'],
  font: ['Inter'],
  mode: 'dark',
  borderRadius: 'md',
  shadow: 'sm',
  spacing: 'normal',
};

export const paletteRoles: PaletteRole[] = [
  {
    key: 'primary',
    label: 'Primary',
    description: 'Main brand color - use for primary buttons, active links, and key interactive elements',
  },
  {
    key: 'secondary',
    label: 'Secondary',
    description: 'Supporting brand color - use for secondary buttons, inactive states, and complementary elements',
  },
  {
    key: 'accent',
    label: 'Accent',
    description: 'Highlight color - use for badges, notifications, focus states, and call-to-action elements',
  },
  {
    key: 'background',
    label: 'Background',
    description: 'Page backdrop - use for the main application/website background behind all content',
  },
  {
    key: 'surface',
    label: 'Surface',
    description: 'Elevated content areas - use for cards, modals, dropdowns, and panels that sit above the background',
  },
  { key: 'text', label: 'Text', description: 'Primary text - use for headings, body text, and main readable content' },
  {
    key: 'textSecondary',
    label: 'Text Secondary',
    description: 'Muted text - use for captions, placeholders, timestamps, and less important information',
  },
  {
    key: 'border',
    label: 'Border',
    description: 'Separators - use for input borders, dividers, table lines, and element outlines',
  },
  {
    key: 'success',
    label: 'Success',
    description: 'Positive feedback - use for success messages, completed states, and positive indicators',
  },
  {
    key: 'warning',
    label: 'Warning',
    description: 'Caution alerts - use for warning messages, pending states, and attention-needed indicators',
  },
  {
    key: 'error',
    label: 'Error',
    description: 'Error states - use for error messages, failed states, and destructive action indicators',
  },
];

export const designFeatures: DesignOption[] = [
  { key: 'rounded', label: 'Rounded Corners' },
  { key: 'border', label: 'Subtle Border' },
  { key: 'gradient', label: 'Gradient Accent' },
  { key: 'shadow', label: 'Soft Shadow' },
  { key: 'frosted-glass', label: 'Frosted Glass' },
];

export const designFonts: FontOption[] = [
  { key: 'Inter', label: 'Inter', preview: 'Aa' },
  { key: 'Roboto', label: 'Roboto', preview: 'Aa' },
  { key: 'Open Sans', label: 'Open Sans', preview: 'Aa' },
  { key: 'Montserrat', label: 'Montserrat', preview: 'Aa' },
  { key: 'Poppins', label: 'Poppins', preview: 'Aa' },
  { key: 'Lato', label: 'Lato', preview: 'Aa' },
  { key: 'JetBrains Mono', label: 'JetBrains Mono', preview: 'Aa' },
  { key: 'Raleway', label: 'Raleway', preview: 'Aa' },
  { key: 'Lora', label: 'Lora', preview: 'Aa' },
];

export const borderRadiusOptions: DesignOption[] = [
  { key: 'none', label: 'None' },
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra Large' },
  { key: 'full', label: 'Full' },
];

export const shadowOptions: DesignOption[] = [
  { key: 'none', label: 'None' },
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra Large' },
];

export const spacingOptions: DesignOption[] = [
  { key: 'tight', label: 'Tight' },
  { key: 'normal', label: 'Normal' },
  { key: 'relaxed', label: 'Relaxed' },
  { key: 'loose', label: 'Loose' },
];

export const presetThemes: ThemePreset[] = [
  { key: 'minimal', label: 'Minimal', image: '/style_presets/minimal.webp' },
  { key: 'modern', label: 'Modern', image: '/style_presets/modern.webp' },
  { key: 'carbon', label: 'Carbon', image: '/style_presets/carbon.webp' },
  { key: 'material', label: 'Material', image: '/style_presets/material.webp' },
  { key: 'flat', label: 'Flat', image: '/style_presets/flat.webp' },
  { key: 'neobrutalism', label: 'Neobrutalism', image: '/style_presets/neobrutalism.webp' },
  { key: 'glassmorphism', label: 'Glassmorphism', image: '/style_presets/glassmorphism.webp' },
  { key: 'claymorphism', label: 'Claymorphism', image: '/style_presets/claymorphism.webp' },
  { key: 'retro', label: 'Retro', image: '/style_presets/retro.webp' },
  { key: 'neumorphism', label: 'Neumorphism', image: '/style_presets/neumorphism.webp' },
  { key: 'cyberpunk', label: 'Cyberpunk', image: '/style_presets/cyberpunk.webp' },
];

export const predefinedColors: ColorPreset[] = [
  { key: 'red', label: 'Red', value: '#ef4444' },
  { key: 'orange', label: 'Orange', value: '#f97316' },
  { key: 'amber', label: 'Amber', value: '#f59e0b' },
  { key: 'yellow', label: 'Yellow', value: '#eab308' },
  { key: 'lime', label: 'Lime', value: '#84cc16' },
  { key: 'green', label: 'Green', value: '#22c55e' },
  { key: 'emerald', label: 'Emerald', value: '#10b981' },
  { key: 'teal', label: 'Teal', value: '#14b8a6' },
  { key: 'cyan', label: 'Cyan', value: '#06b6d4' },
  { key: 'sky', label: 'Sky', value: '#0ea5e9' },
  { key: 'blue', label: 'Blue', value: '#3b82f6' },
  { key: 'indigo', label: 'Indigo', value: '#6366f1' },
  { key: 'violet', label: 'Violet', value: '#8b5cf6' },
  { key: 'purple', label: 'Purple', value: '#a855f7' },
  { key: 'fuchsia', label: 'Fuchsia', value: '#d946ef' },
  { key: 'pink', label: 'Pink', value: '#ec4899' },
  { key: 'rose', label: 'Rose', value: '#f43f5e' },
  { key: 'slate', label: 'Slate', value: '#64748b' },
  { key: 'gray', label: 'Gray', value: '#6b7280' },
  { key: 'zinc', label: 'Zinc', value: '#71717a' },
  { key: 'neutral', label: 'Neutral', value: '#737373' },
  { key: 'stone', label: 'Stone', value: '#78716c' },
];

export function getBorderRadiusValue(key: string, hasRoundedFeature: boolean = false): string {
  if (hasRoundedFeature) {
    return '1.5rem';
  }

  switch (key) {
    case 'none':
      return '0px';
    case 'sm':
      return '0.25rem';
    case 'md':
      return '0.375rem';
    case 'lg':
      return '0.5rem';
    case 'xl':
      return '0.75rem';
    case 'full':
      return '9999px';
    default:
      return '0.375rem';
  }
}

export function getBoxShadowValue(key: string, hasShadowFeature: boolean = false): string {
  if (!hasShadowFeature) {
    return 'none';
  }

  switch (key) {
    case 'none':
      return 'none';
    default:
      return 'none';
  }
}

export function getSpacingValue(key: string): string {
  switch (key) {
    case 'tight':
      return '0.75rem';
    case 'normal':
      return '1rem';
    case 'relaxed':
      return '1.25rem';
    case 'loose':
      return '1.5rem';
    default:
      return '1rem';
  }
}
