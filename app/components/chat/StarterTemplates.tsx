import React from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';
import { TextShimmer } from '~/components/ui/text-shimmer';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => (
  <a
    href={`/git?url=https://github.com/${template.githubRepo}`}
    data-state="closed"
    data-discover="true"
    className="items-center justify-center"
  >
    <div
      className={`inline-block ${template.icon} w-8 h-8 text-4xl transition-theme opacity-25 hover:opacity-100 dark:text-white dark:opacity-50 dark:hover:opacity-100 transition-all`}
      title={template.label}
    />
  </a>
);

const StarterTemplates: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm text-gray-500 mt-6">
        <TextShimmer>Please select your favourite stack to begin...</TextShimmer>
      </span>
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-sm">
          {STARTER_TEMPLATES.map((template) => (
            <FrameworkLink key={template.name} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarterTemplates;
