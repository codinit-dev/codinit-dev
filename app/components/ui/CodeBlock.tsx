import React, { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { Tooltip } from './Tooltip';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: string;
  className?: string;
  onCopy?: () => void;
}

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  maxHeight = '400px',
  className,
  onCopy,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const lines = code.split('\n');

  return (
    <div
      className={classNames(
        'rounded-lg overflow-hidden border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark',
        'bg-codinit-elements-background-depth-2 dark:bg-codinit-elements-background-depth-3',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-codinit-elements-background-depth-3 dark:bg-codinit-elements-background-depth-4 border-b border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark">
        <div className="flex items-center gap-2">
          {filename && (
            <>
              <FileIcon filename={filename} size="sm" />
              <span className="text-xs font-medium text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark">
                {filename}
              </span>
            </>
          )}
          {language && !filename && (
            <span className="text-xs font-medium text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary-dark uppercase">
              {language}
            </span>
          )}
        </div>
        <Tooltip content={copied ? 'Copied!' : 'Copy code'}>
          <motion.button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-codinit-elements-textTertiary hover:text-codinit-elements-textSecondary dark:text-codinit-elements-textTertiary-dark dark:hover:text-codinit-elements-textSecondary-dark hover:bg-codinit-elements-background-depth-2 dark:hover:bg-codinit-elements-background-depth-3 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? <span className="i-ph:check w-4 h-4 text-green-500" /> : <span className="i-ph:copy w-4 h-4" />}
          </motion.button>
        </Tooltip>
      </div>

      {/* Code content */}
      <div className={classNames('overflow-auto', 'font-mono text-sm', 'custom-scrollbar')} style={{ maxHeight }}>
        <table className="min-w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={index}
                className={classNames(
                  highlightLines.includes(index + 1) ? 'bg-purple-500/10 dark:bg-purple-500/20' : '',
                  'hover:bg-codinit-elements-background-depth-3 dark:hover:bg-codinit-elements-background-depth-4',
                )}
              >
                {showLineNumbers && (
                  <td className="py-1 pl-4 pr-2 text-right select-none text-codinit-elements-textTertiary dark:text-codinit-elements-textTertiary-dark border-r border-codinit-elements-borderColor dark:border-codinit-elements-borderColor-dark">
                    <span className="inline-block min-w-[1.5rem] text-xs">{index + 1}</span>
                  </td>
                )}
                <td className="py-1 pl-4 pr-4 text-codinit-elements-textPrimary dark:text-codinit-elements-textPrimary-dark whitespace-pre">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
