import React, { useState, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';

import type { DesignScheme } from '~/types/design-scheme';
import {
  defaultDesignScheme,
  designFeatures,
  designFonts,
  paletteRoles,
  borderRadiusOptions,
  shadowOptions,
  spacingOptions,
} from '~/types/design-scheme';

export interface ColorSchemeDialogProps {
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
}

export const ColorSchemeDialog: React.FC<ColorSchemeDialogProps> = ({ setDesignScheme, designScheme }) => {
  const [palette, setPalette] = useState(() => {
    if (designScheme?.palette) {
      return {
        light: { ...defaultDesignScheme.palette.light, ...designScheme.palette.light },
        dark: { ...defaultDesignScheme.palette.dark, ...designScheme.palette.dark },
      };
    }

    return defaultDesignScheme.palette;
  });

  const [mode, setMode] = useState<'light' | 'dark'>(designScheme?.mode || defaultDesignScheme.mode);
  const [features, setFeatures] = useState<string[]>(designScheme?.features || defaultDesignScheme.features);
  const [font, setFont] = useState<string[]>(designScheme?.font || defaultDesignScheme.font);
  const [borderRadius, setBorderRadius] = useState<string>(
    designScheme?.borderRadius || defaultDesignScheme.borderRadius,
  );
  const [shadow, setShadow] = useState<string>(designScheme?.shadow || defaultDesignScheme.shadow);
  const [spacing, setSpacing] = useState<string>(designScheme?.spacing || defaultDesignScheme.spacing);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'features' | 'styling'>('colors');
  const [expandedColorGroups, setExpandedColorGroups] = useState<string[]>([
    'primary',
    'secondary',
    'accent',
    'background',
  ]);

  useEffect(() => {
    if (designScheme) {
      setPalette(() => ({
        light: { ...defaultDesignScheme.palette.light, ...designScheme.palette.light },
        dark: { ...defaultDesignScheme.palette.dark, ...designScheme.palette.dark },
      }));
      setMode(designScheme.mode || defaultDesignScheme.mode);
      setFeatures(designScheme.features || defaultDesignScheme.features);
      setFont(designScheme.font || defaultDesignScheme.font);
      setBorderRadius(designScheme.borderRadius || defaultDesignScheme.borderRadius);
      setShadow(designScheme.shadow || defaultDesignScheme.shadow);
      setSpacing(designScheme.spacing || defaultDesignScheme.spacing);
    } else {
      setPalette(defaultDesignScheme.palette);
      setMode(defaultDesignScheme.mode);
      setFeatures(defaultDesignScheme.features);
      setFont(defaultDesignScheme.font);
      setBorderRadius(defaultDesignScheme.borderRadius);
      setShadow(defaultDesignScheme.shadow);
      setSpacing(defaultDesignScheme.spacing);
    }
  }, [designScheme]);

  const handleColorChange = (role: string, value: string) => {
    setPalette((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [role]: value,
      },
    }));
  };

  const handleFeatureToggle = (key: string) => {
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleFontToggle = (key: string) => {
    setFont((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleSave = () => {
    setDesignScheme?.({ palette, features, font, mode, borderRadius, shadow, spacing });
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    setPalette(defaultDesignScheme.palette);
    setMode(defaultDesignScheme.mode);
    setFeatures(defaultDesignScheme.features);
    setFont(defaultDesignScheme.font);
    setBorderRadius(defaultDesignScheme.borderRadius);
    setShadow(defaultDesignScheme.shadow);
    setSpacing(defaultDesignScheme.spacing);
  };

  const getBorderRadius = () => {
    if (features.includes('rounded')) {
      return '1.5rem';
    }

    switch (borderRadius) {
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
      default:
        return '1rem';
    }
  };

  const getBoxShadow = () => {
    if (!features.includes('shadow')) {
      return 'none';
    }

    switch (shadow) {
      case 'none':
        return 'none';
      case 'sm':
        return '0 1px 2px 0 rgb(0 0 0 / 0.1)';
      case 'md':
        return '0 4px 6px -1px rgb(0 0 0 / 0.1)';
      case 'lg':
        return '0 10px 15px -3px rgb(0 0 0 / 0.1)';
      case 'xl':
        return '0 20px 25px -5px rgb(0 0 0 / 0.1)';
      default:
        return 'none';
    }
  };

  const toggleColorGroup = (groupKey: string) => {
    setExpandedColorGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((key) => key !== groupKey) : [...prev, groupKey],
    );
  };

  const colorGroups = [
    {
      key: 'primary',
      label: 'Primary',
      colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('primary')),
    },
    {
      key: 'secondary',
      label: 'Secondary',
      colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('secondary')),
    },
    {
      key: 'accent',
      label: 'Accent',
      colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('accent')),
    },
    {
      key: 'background',
      label: 'Base',
      colors: paletteRoles.filter(
        (role) =>
          role.key === 'background' || role.key === 'foreground' || role.key === 'text' || role.key === 'textSecondary',
      ),
    },
    {
      key: 'card',
      label: 'Card',
      colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('card')),
    },
    {
      key: 'other',
      label: 'Other',
      colors: paletteRoles.filter(
        (role) =>
          !role.key.toLowerCase().includes('primary') &&
          !role.key.toLowerCase().includes('secondary') &&
          !role.key.toLowerCase().includes('accent') &&
          !role.key.toLowerCase().includes('card') &&
          role.key !== 'background' &&
          role.key !== 'foreground' &&
          role.key !== 'text' &&
          role.key !== 'textSecondary',
      ),
    },
  ].filter((group) => group.colors.length > 0);

  const renderColorSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-codinit-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-codinit-elements-item-contentAccent"></div>
          Color Palette
        </h3>
        <Button onClick={handleReset} variant="ghost" size="sm" className="flex items-center gap-2">
          <span className="i-ph:arrow-clockwise text-sm" />
          Reset
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {colorGroups.map((group) => {
          const isExpanded = expandedColorGroups.includes(group.key);

          return (
            <div
              key={group.key}
              className="border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleColorGroup(group.key)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors bg-transparent hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codinit-elements-ring"
              >
                <span className="text-sm font-medium text-codinit-elements-textPrimary dark:text-codinit-elements-textPrimary-dark">
                  {group.label}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-4 h-4 text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6.23 7.47a.75.75 0 0 1 1.06-.02L12 12.18l4.71-4.73a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0L6.21 8.53a.75.75 0 0 1 .02-1.06" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark">
                  {group.colors.map((role) => (
                    <div
                      key={role.key}
                      className="flex items-center justify-between p-3 bg-transparent hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark transition-colors border-b border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark last:border-b-0"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-shrink-0">
                          <div
                            className="h-8 w-8 rounded border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark cursor-pointer hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codinit-elements-ring"
                            style={{ backgroundColor: palette[mode][role.key] }}
                            onClick={() => document.getElementById(`color-input-${role.key}`)?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label={`Change ${role.label} color`}
                          />
                          <input
                            id={`color-input-${role.key}`}
                            type="color"
                            value={palette[mode][role.key]}
                            onChange={(e) => handleColorChange(role.key, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            tabIndex={-1}
                          />
                        </div>
                        <span className="text-sm text-codinit-elements-textPrimary dark:text-codinit-elements-textPrimary-dark font-medium">
                          {role.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark">
                        {palette[mode][role.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTypographySection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-codinit-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-codinit-elements-item-contentAccent"></div>
        Typography
      </h3>

      <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {designFonts.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFontToggle(f.key)}
            className={`group p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-codinit-elements-borderColorActive ${
              font.includes(f.key)
                ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white shadow-lg'
                : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark hover:border-codinit-elements-borderColorActive hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark'
            }`}
          >
            <div className="text-center space-y-2">
              <div
                className={`text-2xl font-medium transition-colors ${
                  font.includes(f.key) ? 'text-white' : 'text-codinit-elements-textPrimary'
                }`}
                style={{ fontFamily: f.key }}
              >
                {f.preview}
              </div>
              <div
                className={`text-sm font-medium transition-colors ${
                  font.includes(f.key) ? 'text-white' : 'text-codinit-elements-textSecondary'
                }`}
              >
                {f.label}
              </div>
              {font.includes(f.key) && (
                <div className="w-6 h-6 mx-auto bg-codinit-elements-item-contentAccent rounded-full flex items-center justify-center">
                  <span className="i-ph:check text-white text-sm" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-codinit-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-codinit-elements-item-contentAccent"></div>
        Design Features
      </h3>

      <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {designFeatures.map((f) => {
          const isSelected = features.includes(f.key);

          return (
            <div key={f.key} className="feature-card-container p-2">
              <button
                type="button"
                onClick={() => handleFeatureToggle(f.key)}
                className={`group relative w-full p-6 text-sm font-medium transition-all duration-200 bg-codinit-elements-background-depth-3 text-codinit-elements-item-textSecondary ${
                  f.key === 'rounded'
                    ? isSelected
                      ? 'rounded-3xl'
                      : 'rounded-xl'
                    : f.key === 'border'
                      ? 'rounded-lg'
                      : 'rounded-xl'
                } ${
                  f.key === 'border'
                    ? isSelected
                      ? 'border-3 border-codinit-elements-borderColorActive bg-codinit-elements-item-backgroundAccent text-white'
                      : 'border-2 border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark'
                    : f.key === 'gradient'
                      ? ''
                      : isSelected
                        ? 'bg-codinit-elements-item-backgroundAccent text-white shadow-lg'
                        : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark'
                } ${f.key === 'shadow' ? (isSelected ? 'shadow-xl' : 'shadow-lg') : 'shadow-md'}`}
                style={{
                  ...(f.key === 'gradient' && {
                    background: isSelected
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'var(--codinit-elements-background-depth-3)',
                    color: isSelected ? 'white' : 'var(--codinit-elements-textSecondary)',
                  }),
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-codinit-elements-background-depth-1 bg-opacity-20">
                    {f.key === 'rounded' && (
                      <div
                        className={`w-6 h-6 bg-current transition-all duration-200 ${
                          isSelected ? 'rounded-full' : 'rounded'
                        } opacity-80`}
                      />
                    )}
                    {f.key === 'border' && (
                      <div
                        className={`w-6 h-6 rounded-lg transition-all duration-200 ${
                          isSelected ? 'border-3 border-current opacity-90' : 'border-2 border-current opacity-70'
                        }`}
                      />
                    )}
                    {f.key === 'gradient' && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 via-pink-400 to-indigo-400 opacity-90" />
                    )}
                    {f.key === 'shadow' && (
                      <div className="relative">
                        <div
                          className={`w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
                            isSelected ? 'opacity-90' : 'opacity-70'
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
                            isSelected ? 'opacity-40' : 'opacity-30'
                          }`}
                        />
                      </div>
                    )}
                    {f.key === 'frosted-glass' && (
                      <div className="relative">
                        <div
                          className={`w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-sm bg-white/20 border border-white/30 ${
                            isSelected ? 'opacity-90' : 'opacity-70'
                          }`}
                        />
                        <div
                          className={`absolute inset-0 w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-md bg-gradient-to-br from-white/10 to-transparent ${
                            isSelected ? 'opacity-60' : 'opacity-40'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="font-semibold">{f.label}</div>
                    {isSelected && <div className="mt-2 w-8 h-1 bg-current rounded-full mx-auto opacity-60" />}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const getBorderRadiusPixels = (key: string): string => {
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
  };

  const getSpacingPixels = (key: string): string => {
    switch (key) {
      case 'tight':
        return '0.5rem';
      case 'normal':
        return '1rem';
      case 'relaxed':
        return '1.25rem';
      case 'loose':
        return '1.5rem';
      default:
        return '1rem';
    }
  };

  const renderStylingSection = () => (
    <div className="space-y-6 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
      <div className="space-y-6 pr-2">
        <h3 className="text-lg font-semibold text-codinit-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-codinit-elements-item-contentAccent"></div>
          Design Styling
        </h3>

        {/* Border Radius */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-codinit-elements-textPrimary">Border Radius</label>
          <div className="grid grid-cols-2 gap-2">
            {borderRadiusOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setBorderRadius(option.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-codinit-elements-borderColorActive ${
                  borderRadius === option.key
                    ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white'
                    : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark'
                }`}
              >
                <div className="text-center space-y-1">
                  <div
                    className="w-6 h-6 mx-auto bg-current opacity-80"
                    style={{ borderRadius: getBorderRadiusPixels(option.key) }}
                  />
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-codinit-elements-textPrimary">Shadow</label>
          <div className="grid grid-cols-2 gap-2">
            {shadowOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setShadow(option.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-codinit-elements-borderColorActive ${
                  shadow === option.key
                    ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white'
                    : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark'
                }`}
                style={{
                  boxShadow: shadow === option.key ? getBoxShadow() : 'none',
                }}
              >
                <div className="text-center space-y-1">
                  <div className="w-6 h-6 mx-auto bg-current rounded opacity-80" />
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-codinit-elements-textPrimary">Spacing</label>
          <div className="grid grid-cols-2 gap-2">
            {spacingOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSpacing(option.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-codinit-elements-borderColorActive ${
                  spacing === option.key
                    ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white'
                    : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark'
                }`}
              >
                <div className="text-center space-y-1">
                  <div
                    className="flex justify-center items-center opacity-80"
                    style={{ gap: getSpacingPixels(option.key) }}
                  >
                    <div className="w-2 h-6 bg-current rounded" />
                    <div className="w-2 h-6 bg-current rounded" />
                    <div className="w-2 h-6 bg-current rounded" />
                  </div>
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <IconButton title="Design System" className="transition-all" onClick={() => setIsDialogOpen(true)}>
        <div className="i-ph:palette text-xl"></div>
      </IconButton>

      <RadixDialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          </RadixDialog.Overlay>

          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <RadixDialog.Content asChild>
              <motion.div
                className={classNames(
                  'h-[90dvh] max-h-[900px] w-[95dvw] max-w-[1400px]',
                  'bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-xl shadow-2xl',
                  'flex flex-col overflow-hidden focus:outline-none px-0 py-0',
                )}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Close button */}
                <RadixDialog.Close asChild>
                  <button
                    className={classNames(
                      'absolute top-2 right-2 z-[10000] flex items-center justify-center',
                      'w-9 h-9 rounded-lg transition-all duration-200',
                      'bg-transparent text-codinit-elements-textTertiary',
                      'hover:bg-codinit-elements-background-depth-2 hover:text-codinit-elements-textPrimary',
                      'focus:outline-none focus:ring-2 focus:ring-codinit-elements-borderColor',
                    )}
                    aria-label="Close design settings"
                  >
                    <div className="i-lucide:x w-4 h-4" />
                  </button>
                </RadixDialog.Close>

                {/* Header */}
                <div className="border-b border-codinit-elements-borderColor p-6 bg-codinit-elements-background-depth-1">
                  <h2 className="text-lg font-semibold text-codinit-elements-textPrimary">
                    Design Palette (experimental)
                  </h2>
                  <p className="text-sm text-codinit-elements-textSecondary mt-1">
                    Customize your color palette, typography, and design features. These preferences will guide the AI
                    in creating designs that match your style.
                  </p>
                </div>

                {/* Content Area - Two Column Layout */}
                <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-6 pt-6 bg-codinit-elements-background-depth-1">
                  {/* Left Panel - Settings */}
                  <div className="w-80 flex flex-col gap-4">
                    {/* Integrated Tab Navigation */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="grid grid-cols-2 gap-1 p-1 bg-codinit-elements-background-depth-1 dark:bg-codinit-elements-background-depth-1-dark border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark rounded-lg mb-4">
                        {[
                          { key: 'colors', label: 'Colors' },
                          { key: 'typography', label: 'Typography' },
                          { key: 'features', label: 'Features' },
                          { key: 'styling', label: 'Styling' },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveSection(tab.key as any)}
                            className={classNames(
                              'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codinit-elements-ring',
                              activeSection === tab.key
                                ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white shadow-sm'
                                : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark',
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeSection === 'colors' && renderColorSection()}
                        {activeSection === 'typography' && renderTypographySection()}
                        {activeSection === 'features' && renderFeaturesSection()}
                        {activeSection === 'styling' && renderStylingSection()}
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Preview */}
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-codinit-elements-textPrimary">Live Preview</h3>
                      <div className="flex items-center gap-1 p-1 bg-codinit-elements-background-depth-1 dark:bg-codinit-elements-background-depth-1-dark border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark rounded-lg">
                        <button
                          onClick={() => setMode('light')}
                          className={classNames(
                            'p-1.5 rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codinit-elements-ring',
                            mode === 'light'
                              ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white shadow-sm'
                              : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark',
                          )}
                          title="Light mode"
                        >
                          <span className="i-ph:sun text-base" />
                        </button>
                        <button
                          onClick={() => setMode('dark')}
                          className={classNames(
                            'p-1.5 rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codinit-elements-ring',
                            mode === 'dark'
                              ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-white shadow-sm'
                              : 'bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-3-dark text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark hover:text-codinit-elements-textPrimary dark:hover:text-codinit-elements-textPrimary-dark hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-2-dark',
                          )}
                          title="Dark mode"
                        >
                          <span className="i-ph:moon text-base" />
                        </button>
                      </div>
                    </div>

                    {/* Preview Container */}
                    <div className="flex-1 rounded-xl border border-codinit-elements-borderColor overflow-hidden bg-codinit-elements-background-depth-3">
                      <div
                        className="h-full w-full overflow-y-auto custom-scrollbar"
                        style={{
                          backgroundColor: palette[mode].background,
                          color: palette[mode].text,
                          fontFamily: font.join(', '),
                          padding: getSpacingPixels(spacing),
                        }}
                      >
                        {/* Preview Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: getSpacingPixels(spacing) }}>
                          {/* Hero Section */}
                          <div
                            className="p-8 text-center"
                            style={{
                              borderRadius: getBorderRadius(),
                              border: features.includes('border') ? `1px solid ${palette[mode].accent}` : 'none',
                              backgroundColor: palette[mode].background,
                              color: palette[mode].text,
                            }}
                          >
                            <h1
                              className="text-3xl font-bold"
                              style={{ color: palette[mode].text, fontFamily: font.join(', ') }}
                            >
                              Ship faster with modern tools
                            </h1>
                            <p
                              className="text-base mt-3"
                              style={{ color: palette[mode].text, opacity: 0.7, fontFamily: font.join(', ') }}
                            >
                              Build beautiful products that your users will love
                            </p>
                            <div className="mt-4 flex justify-center gap-4">
                              <button
                                className="px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                                style={{
                                  backgroundColor: palette[mode].primary,
                                  color: '#ffffff',
                                  borderRadius: getBorderRadius(),
                                  boxShadow: getBoxShadow(),
                                }}
                              >
                                Get started
                              </button>
                              <button
                                className="px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: palette[mode].primary,
                                  borderRadius: getBorderRadius(),
                                  border: `2px solid ${palette[mode].primary}`,
                                }}
                              >
                                View demo
                              </button>
                            </div>
                          </div>

                          {/* Stats Section */}
                          <div className="space-y-8">
                            <div className="space-y-3 text-center">
                              <h2
                                className="text-2xl font-bold"
                                style={{ color: palette[mode].text, fontFamily: font.join(', ') }}
                              >
                                Trusted by teams everywhere
                              </h2>
                              <p
                                className="text-sm"
                                style={{ color: palette[mode].text, opacity: 0.7, fontFamily: font.join(', ') }}
                              >
                                Join thousands of companies building better products faster
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              {[
                                { value: '50K+', label: 'Active users' },
                                { value: '99%', label: 'Customer satisfaction' },
                                { value: '24/7', label: 'Support available' },
                                { value: '150+', label: 'Countries served' },
                              ].map((stat, i) => (
                                <div key={i} className="space-y-1 text-center">
                                  <div
                                    className="text-2xl font-bold"
                                    style={{ color: palette[mode].primary, fontFamily: font.join(', ') }}
                                  >
                                    {stat.value}
                                  </div>
                                  <p
                                    className="text-xs"
                                    style={{ color: palette[mode].text, opacity: 0.7, fontFamily: font.join(', ') }}
                                  >
                                    {stat.label}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pricing Cards */}
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              {
                                name: 'Starter',
                                price: '$19',
                                desc: 'Perfect for individuals and small projects',
                                features: [
                                  '10 projects',
                                  '5GB storage',
                                  'Basic analytics',
                                  'Community support',
                                  'API access',
                                ],
                              },
                              {
                                name: 'Professional',
                                price: '$79',
                                desc: 'Advanced features for growing teams',
                                features: [
                                  'Unlimited projects',
                                  '100GB storage',
                                  'Advanced analytics',
                                  'Priority support',
                                  'Custom integrations',
                                ],
                              },
                            ].map((plan, i) => (
                              <div
                                key={i}
                                className="flex flex-col gap-6 p-6"
                                style={{
                                  borderRadius: getBorderRadius(),
                                  border: features.includes('border') ? `1px solid ${palette[mode].accent}` : 'none',
                                  backgroundColor: palette[mode].secondary,
                                  boxShadow: getBoxShadow(),
                                  background:
                                    i === 1 && features.includes('gradient')
                                      ? `linear-gradient(135deg, ${palette[mode].primary} 0%, ${palette[mode].accent} 100%)`
                                      : palette[mode].secondary,
                                }}
                              >
                                <div className="flex flex-col space-y-1.5">
                                  <div
                                    className="font-medium"
                                    style={{ color: palette[mode].primary, fontFamily: font.join(', ') }}
                                  >
                                    {plan.name}
                                  </div>
                                  <div className="mt-3">
                                    <span
                                      className="text-3xl font-bold"
                                      style={{ color: palette[mode].text, fontFamily: font.join(', ') }}
                                    >
                                      {plan.price}
                                    </span>
                                    <span className="text-sm" style={{ color: palette[mode].text, opacity: 0.7 }}>
                                      /month
                                    </span>
                                  </div>
                                  <div
                                    className="mt-4 text-sm"
                                    style={{ color: palette[mode].text, opacity: 0.7, fontFamily: font.join(', ') }}
                                  >
                                    {plan.desc}
                                  </div>
                                </div>
                                <ul className="space-y-3">
                                  {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-2">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                        style={{ color: palette[mode].accent }}
                                      >
                                        <path d="M18.369 4.595a.75.75 0 0 1 1.262.81l-9 14a.75.75 0 0 1-1.217.064l-5-6.25a.75.75 0 0 1 1.172-.938l4.347 5.435z" />
                                      </svg>
                                      <span style={{ color: palette[mode].text, fontFamily: font.join(', ') }}>
                                        {feature}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                <button
                                  className="w-full px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                                  style={{
                                    backgroundColor: palette[mode].primary,
                                    color: '#ffffff',
                                    borderRadius: getBorderRadius(),
                                  }}
                                >
                                  Start free trial
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* FAQ Section */}
                          <div className="space-y-6">
                            <h2
                              className="text-2xl font-bold"
                              style={{ color: palette[mode].text, fontFamily: font.join(', ') }}
                            >
                              Frequently asked questions
                            </h2>
                            <div className="space-y-4">
                              {[
                                'How do I get started with the platform?',
                                'Can I change my plan later?',
                                'What payment methods do you accept?',
                                'Is there a free trial available?',
                              ].map((question, i) => (
                                <div
                                  key={i}
                                  className="py-4"
                                  style={{ borderBottom: `1px solid ${palette[mode].accent}` }}
                                >
                                  <button>
                                    <span
                                      className="text-sm font-medium"
                                      style={{ color: palette[mode].primary, fontFamily: font.join(', ') }}
                                    >
                                      {question}
                                    </span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="w-5 h-5"
                                      style={{ color: palette[mode].text, opacity: 0.5 }}
                                    >
                                      <path d="M9.47 6.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L13.94 12 9.47 7.53a.75.75 0 0 1 0-1.06" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-codinit-elements-textSecondary text-center">
                      Preview updates in real-time as you change settings
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 bg-codinit-elements-background-depth-1 border-t border-codinit-elements-borderColor">
                  <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSave}
                    className="bg-codinit-elements-button-primary-background hover:bg-codinit-elements-button-primary-backgroundHover text-codinit-elements-button-primary-text"
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </RadixDialog.Content>
          </div>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--codinit-elements-textTertiary) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--codinit-elements-textTertiary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--codinit-elements-textSecondary);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .feature-card-container {
          min-height: 140px;
          display: flex;
          align-items: stretch;
        }
        .feature-card-container button {
          flex: 1;
        }
      `}</style>
    </>
  );
};
