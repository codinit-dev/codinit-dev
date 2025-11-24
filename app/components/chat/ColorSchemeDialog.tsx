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

  const renderColorSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-codinit-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-codinit-elements-item-contentAccent"></div>
          Color Palette
        </h3>
        <button
          onClick={handleReset}
          className="text-sm bg-transparent hover:bg-codinit-elements-background-depth-2 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary rounded-lg flex items-center gap-2 transition-all duration-200"
        >
          <span className="i-ph:arrow-clockwise text-sm" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {paletteRoles.map((role) => (
          <div
            key={role.key}
            className="group flex items-center gap-4 p-4 rounded-xl bg-codinit-elements-background-depth-3 hover:bg-codinit-elements-background-depth-2 border border-transparent hover:border-codinit-elements-borderColor transition-all duration-200"
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:scale-110 ring-2 ring-transparent hover:ring-codinit-elements-borderColorActive"
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
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-codinit-elements-background-depth-1 rounded-full flex items-center justify-center shadow-sm">
                <span className="i-ph:pencil-simple text-xs text-codinit-elements-textSecondary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-codinit-elements-textPrimary transition-colors">{role.label}</div>
              <div className="text-sm text-codinit-elements-textSecondary line-clamp-2 leading-relaxed">
                {role.description}
              </div>
              <div className="text-xs text-codinit-elements-textTertiary font-mono mt-1 px-2 py-1 bg-codinit-elements-background-depth-1 rounded-md inline-block">
                {palette[mode][role.key]}
              </div>
            </div>
          </div>
        ))}
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
                ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive shadow-lg'
                : 'bg-codinit-elements-background-depth-3 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive hover:bg-codinit-elements-background-depth-2'
            }`}
          >
            <div className="text-center space-y-2">
              <div
                className={`text-2xl font-medium transition-colors ${
                  font.includes(f.key)
                    ? 'text-codinit-elements-item-contentAccent'
                    : 'text-codinit-elements-textPrimary'
                }`}
                style={{ fontFamily: f.key }}
              >
                {f.preview}
              </div>
              <div
                className={`text-sm font-medium transition-colors ${
                  font.includes(f.key)
                    ? 'text-codinit-elements-item-contentAccent'
                    : 'text-codinit-elements-textSecondary'
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
                      ? 'border-3 border-codinit-elements-borderColorActive bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent'
                      : 'border-2 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary'
                    : f.key === 'gradient'
                      ? ''
                      : isSelected
                        ? 'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent shadow-lg'
                        : 'bg-codinit-elements-background-depth-3 hover:bg-codinit-elements-background-depth-2 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary'
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

  const renderStylingSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-codinit-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-codinit-elements-item-contentAccent"></div>
        Design Styling
      </h3>

      <div className="grid grid-cols-3 gap-6">
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
                    ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-codinit-elements-item-contentAccent'
                    : 'bg-codinit-elements-background-depth-3 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary'
                }`}
              >
                <div className="text-center space-y-1">
                  <div
                    className={`w-6 h-6 mx-auto rounded-${option.key === 'none' ? 'none' : option.key === 'sm' ? 'sm' : option.key === 'md' ? 'md' : option.key === 'lg' ? 'lg' : option.key === 'xl' ? 'xl' : 'full'} bg-current opacity-80`}
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
                    ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-codinit-elements-item-contentAccent'
                    : 'bg-codinit-elements-background-depth-3 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary'
                } ${option.key === 'none' ? '' : option.key === 'sm' ? 'shadow-sm' : option.key === 'md' ? 'shadow-md' : option.key === 'lg' ? 'shadow-lg' : 'shadow-xl'}`}
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
                    ? 'bg-codinit-elements-item-backgroundAccent border-codinit-elements-borderColorActive text-codinit-elements-item-contentAccent'
                    : 'bg-codinit-elements-background-depth-3 border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary'
                }`}
              >
                <div className="text-center space-y-1">
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-6 bg-current rounded opacity-80" />
                    <div className="w-2 h-6 bg-current rounded opacity-80" />
                    <div className="w-2 h-6 bg-current rounded opacity-80" />
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
                  'w-[90vw] h-[700px] max-w-[1500px] max-h-[85vh]',
                  'bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-xl shadow-2xl',
                  'flex flex-col overflow-hidden focus:outline-none',
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
                <div className="px-8 pt-6 pb-4 bg-codinit-elements-background-depth-1">
                  <h2 className="text-2xl font-bold text-codinit-elements-textPrimary">Design Palette & Features</h2>
                  <p className="text-codinit-elements-textSecondary leading-relaxed mt-2">
                    Customize your color palette, typography, and design features. These preferences will guide the AI
                    in creating designs that match your style.
                  </p>
                </div>

                {/* Navigation Tabs */}
                <div className="px-8 pb-4 bg-codinit-elements-background-depth-1">
                  <div className="flex gap-2 p-1.5 bg-codinit-elements-background-depth-3 rounded-xl">
                    {[
                      { key: 'colors', label: 'Colors', icon: 'i-ph:palette' },
                      { key: 'typography', label: 'Typography', icon: 'i-ph:text-aa' },
                      { key: 'features', label: 'Features', icon: 'i-ph:magic-wand' },
                      { key: 'styling', label: 'Styling', icon: 'i-ph:gear' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveSection(tab.key as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          activeSection === tab.key
                            ? 'bg-codinit-elements-background-depth-1 text-codinit-elements-textPrimary shadow-lg border border-codinit-elements-borderColor'
                            : 'text-codinit-elements-textPrimary hover:text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-2'
                        }`}
                      >
                        <span className={`${tab.icon} text-lg`} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 px-8 py-4 bg-codinit-elements-background-depth-1 overflow-y-auto custom-scrollbar">
                  {activeSection === 'colors' && renderColorSection()}
                  {activeSection === 'typography' && renderTypographySection()}
                  {activeSection === 'features' && renderFeaturesSection()}
                  {activeSection === 'styling' && renderStylingSection()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center px-8 py-4 bg-codinit-elements-background-depth-1 border-t border-codinit-elements-borderColor">
                  <div className="text-sm text-codinit-elements-textSecondary">
                    {Object.keys(palette).length} colors • {font.length} fonts • {features.length} features
                  </div>
                  <div className="flex gap-3">
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
