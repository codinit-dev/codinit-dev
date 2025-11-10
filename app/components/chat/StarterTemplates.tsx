import React from 'react';
import type { Template } from '~/types/template';
import type { Message } from 'ai';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface FrameworkLinkProps {
  template: Template;
  onSelect: (template: Template) => void;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template, onSelect }) => (
  <button
    onClick={() => onSelect(template)}
    data-state="closed"
    data-discover="true"
    className="items-center justify-center"
  >
    <div
      className={`inline-block ${template.icon} w-8 h-8 text-4xl transition-theme opacity-25 hover:opacity-100 hover:text-blue-600 dark:text-white dark:opacity-50 dark:hover:opacity-100 dark:hover:text-blue-400 transition-all`}
      title={template.label}
    />
  </button>
);

interface StarterTemplatesProps {
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

const StarterTemplates: React.FC<StarterTemplatesProps> = ({ importChat }) => {
  const handleSelect = (template: Template) => {
    if (importChat) {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: `Build a ${template.label} application`,
        },
      ];
      importChat(template.description, messages);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm text-gray-500 mt-6">Please select your favourite stack to begin...</span>
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-sm">
          {STARTER_TEMPLATES.map((template) => (
            <FrameworkLink key={template.name} template={template} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarterTemplates;
