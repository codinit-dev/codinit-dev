import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'codinit';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#ffffff',

  gray: {
    50: '#f5f5f5',
    100: '#e5e5e5',
    200: '#d4d4d4',
    300: '#b3b3b5',
    400: '#9a9a9d',
    500: '#7a7a7d',
    600: '#5e5e61',
    700: '#404043',
    800: '#262628',
    900: '#1b1b1d', // editor background
    950: '#0f0f10', // root background
  },

  slate: {
    50: '#f7f8fa',
    100: '#e9ecf3',
    200: '#d3d7e0',
    300: '#bac2cd',
    400: '#8e93a0',
    500: '#6f7480',
    600: '#525560',
    700: '#3a3c44',
    800: '#24252c',
    900: '#18181d',
    950: '#0d0d10',
  },

  accent: {
    50: '#eef5ff',
    100: '#d7e7ff',
    200: '#b7d5ff',
    300: '#8cbcfe',
    400: '#5a99ff',
    500: '#337bff', // main blue accent in screenshot
    600: '#2360d4',
    700: '#184aad',
    800: '#133a88',
    900: '#0f2c6b',
    950: '#0a1b45',
  },

  green: {
    50: '#e9fdf1',
    100: '#c7f7dc',
    200: '#9deebf',
    300: '#67e29b',
    400: '#37cf74',
    500: '#16b65b',
    600: '#10964a',
    700: '#0f753c',
    800: '#0f5c31',
    900: '#0c4525',
    950: '#062716',
  },

  orange: {
    50: '#fff4e9',
    100: '#ffe7c9',
    200: '#ffd394',
    300: '#ffbb55',
    400: '#ffa024',
    500: '#f28b05',
    600: '#d06d04',
    700: '#a35107',
    800: '#7f3f09',
    900: '#65330a',
  },

  red: {
    50: '#ffecec',
    100: '#ffd5d5',
    200: '#ffb5b5',
    300: '#ff8888',
    400: '#ff5f5f',
    500: '#ff3b3b',
    600: '#db2d2d',
    700: '#b22222',
    800: '#8c1c1c',
    900: '#6e1717',
    950: '#3e0c0c',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,

  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    slate: generateAlphaPalette(BASE_COLORS.slate[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [
    ...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-codinit:${x}`),

    // Add common Lucide icons to safelist
    'i-lucide:eye',
    'i-lucide:code',
    'i-lucide:database',
    'i-lucide:terminal',
    'i-lucide:settings',
    'i-lucide:rotate-cw',
    'i-lucide:more-horizontal',
    'i-lucide:external-link',
    'i-lucide:monitor',
    'i-lucide:download',
    'i-lucide:cloud-download',
    'i-lucide:git-branch',
    'i-lucide:loader-2',
  ],
  shortcuts: {
    'codinit-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 codinit-ease-cubic-bezier',
    kdb: 'bg-codinit-elements-code-background text-codinit-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      codinit: {
        elements: {
          borderColor: 'var(--codinit-elements-borderColor)',
          borderColorActive: 'var(--codinit-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--codinit-elements-bg-depth-1)',
              2: 'var(--codinit-elements-bg-depth-2)',
              3: 'var(--codinit-elements-bg-depth-3)',
              4: 'var(--codinit-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--codinit-elements-textPrimary)',
          textSecondary: 'var(--codinit-elements-textSecondary)',
          textTertiary: 'var(--codinit-elements-textTertiary)',
          code: {
            background: 'var(--codinit-elements-code-background)',
            text: 'var(--codinit-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--codinit-elements-button-primary-background)',
              backgroundHover: 'var(--codinit-elements-button-primary-backgroundHover)',
              text: 'var(--codinit-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--codinit-elements-button-secondary-background)',
              backgroundHover: 'var(--codinit-elements-button-secondary-backgroundHover)',
              text: 'var(--codinit-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--codinit-elements-button-danger-background)',
              backgroundHover: 'var(--codinit-elements-button-danger-backgroundHover)',
              text: 'var(--codinit-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--codinit-elements-item-contentDefault)',
            contentActive: 'var(--codinit-elements-item-contentActive)',
            contentAccent: 'var(--codinit-elements-item-contentAccent)',
            contentDanger: 'var(--codinit-elements-item-contentDanger)',
            backgroundDefault: 'var(--codinit-elements-item-backgroundDefault)',
            backgroundActive: 'var(--codinit-elements-item-backgroundActive)',
            backgroundAccent: 'var(--codinit-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--codinit-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--codinit-elements-actions-background)',
            code: {
              background: 'var(--codinit-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--codinit-elements-artifacts-background)',
            backgroundHover: 'var(--codinit-elements-artifacts-backgroundHover)',
            borderColor: 'var(--codinit-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--codinit-elements-artifacts-inlineCode-background)',
              text: 'var(--codinit-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--codinit-elements-messages-background)',
            linkColor: 'var(--codinit-elements-messages-linkColor)',
            code: {
              background: 'var(--codinit-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--codinit-elements-messages-inlineCode-background)',
              text: 'var(--codinit-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--codinit-elements-icon-success)',
            error: 'var(--codinit-elements-icon-error)',
            primary: 'var(--codinit-elements-icon-primary)',
            secondary: 'var(--codinit-elements-icon-secondary)',
            tertiary: 'var(--codinit-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--codinit-elements-preview-addressBar-background)',
              backgroundHover: 'var(--codinit-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--codinit-elements-preview-addressBar-backgroundActive)',
              text: 'var(--codinit-elements-preview-addressBar-text)',
              textActive: 'var(--codinit-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--codinit-elements-terminals-background)',
            buttonBackground: 'var(--codinit-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--codinit-elements-dividerColor)',
          loader: {
            background: 'var(--codinit-elements-loader-background)',
            progress: 'var(--codinit-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--codinit-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--codinit-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--codinit-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--codinit-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--codinit-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--codinit-elements-cta-background)',
            text: 'var(--codinit-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: customIconCollection,
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
