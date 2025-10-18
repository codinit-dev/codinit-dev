import React, { useState } from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface TemplateCardProps {
  template: Template;
  onSelectTemplate?: (template: Template) => void;
  isSelected?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelectTemplate, isSelected }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <button
      onClick={handleClick}
      data-state="closed"
      data-discover="true"
      className="group flex-shrink-0 bg-transparent border-0 p-0"
    >
      <div
        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-300 w-[90px] h-[90px] cursor-pointer transform hover:scale-105 hover:shadow-lg ${
          isSelected
            ? 'border-purple-500 dark:border-purple-400 bg-codinit-elements-background-depth-3 shadow-md ring-2 ring-purple-500/50 dark:ring-purple-400/50'
            : 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-2 hover:bg-codinit-elements-background-depth-3 hover:border-purple-500 dark:hover:border-purple-400'
        }`}
      >
        <div
          className={`${template.icon} w-8 h-8 text-3xl transition-all duration-300 group-hover:scale-110 ${
            isSelected
              ? 'text-purple-500 dark:text-purple-400'
              : 'text-codinit-elements-textSecondary group-hover:text-purple-500 dark:group-hover:text-purple-400'
          }`}
        />
        <span
          className={`text-[10px] font-medium transition-colors text-center line-clamp-2 w-full px-1 ${
            isSelected
              ? 'text-codinit-elements-textPrimary font-semibold'
              : 'text-codinit-elements-textSecondary group-hover:text-codinit-elements-textPrimary'
          }`}
        >
          {template.label}
        </span>
      </div>
    </button>
  );
};

interface StarterTemplatesProps {
  onSelectTemplate?: (templateName: string) => void;
  selectedTemplate?: string | null;
}

const StarterTemplates: React.FC<StarterTemplatesProps> = ({ onSelectTemplate, selectedTemplate }) => {
  const [isPaused, setIsPaused] = useState(false);

  const handleTemplateSelect = (template: Template) => {
    if (onSelectTemplate) {
      // Pass the template name to trigger initialization
      onSelectTemplate(template.name);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full px-4">
      {selectedTemplate && (
        <div className="text-sm text-codinit-elements-textSecondary mb-2">
          Selected Template:{' '}
          <span className="text-purple-500 dark:text-purple-400 font-semibold">{selectedTemplate}</span>
        </div>
      )}
      <div className="relative w-full max-w-5xl overflow-hidden">
        <div
          className="flex gap-4 animate-scroll-loop"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* First set of templates */}
          {STARTER_TEMPLATES.map((template) => (
            <TemplateCard
              key={`${template.name}-1`}
              template={template}
              onSelectTemplate={handleTemplateSelect}
              isSelected={selectedTemplate === template.name}
            />
          ))}
          {/* Duplicate set for seamless loop */}
          {STARTER_TEMPLATES.map((template) => (
            <TemplateCard
              key={`${template.name}-2`}
              template={template}
              onSelectTemplate={handleTemplateSelect}
              isSelected={selectedTemplate === template.name}
            />
          ))}
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes scroll-loop {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-loop {
          animation: scroll-loop 30s linear infinite;
          will-change: transform;
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StarterTemplates;
