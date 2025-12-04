import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { cubicEasingFn } from '~/utils/easings';
import type { TestArtifactState } from '~/lib/stores/workbench';

interface TestArtifactProps {
  messageId: string;
}

export const TestArtifact = memo(({ messageId }: TestArtifactProps) => {
  const [showDetails, setShowDetails] = useState(true);

  const testArtifacts = useStore(workbenchStore.testArtifacts);
  const testArtifact = testArtifacts[messageId];

  if (!testArtifact) {
    return null;
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleRerun = () => {
    const terminal = workbenchStore.codinitTerminal;
    terminal.executeCommand(`test-rerun-${Date.now()}`, testArtifact.command);
  };

  const handleFileClick = (filePath: string) => {
    workbenchStore.setSelectedFile(filePath);
  };

  const { summary, status } = testArtifact;
  const hasFailures = summary.failed > 0;
  const isRunning = status === 'running';
  const isSuccess = status === 'complete' && !hasFailures;

  return (
    <div className="test-artifact border border-codinit-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
      <div className="flex">
        <div className="flex items-stretch bg-codinit-elements-artifacts-background hover:bg-codinit-elements-artifacts-backgroundHover w-full overflow-hidden">
          <div className="px-5 p-3.5 w-full text-left">
            <div className="flex items-center gap-2 w-full">
              <div className={`text-lg ${getStatusIconColor(status, hasFailures)}`}>
                {isRunning ? (
                  <div className="i-svg-spinners:90-ring-with-bg"></div>
                ) : isSuccess ? (
                  <div className="i-ph:check-circle-fill"></div>
                ) : (
                  <div className="i-ph:x-circle-fill"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="w-full text-codinit-elements-textPrimary font-medium leading-5 text-sm">
                  {testArtifact.title}
                </div>
                <div className="w-full text-codinit-elements-textSecondary text-xs mt-0.5">
                  {summary.passed}/{summary.total} passed • {testArtifact.duration}ms
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded text-xs font-medium ${getSummaryBadgeClass(status, hasFailures)}`}>
                {isRunning ? 'Running...' : `${summary.passed}/${summary.total}`}
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
          <motion.button
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.15, ease: cubicEasingFn }}
            className="bg-codinit-elements-artifacts-background hover:bg-codinit-elements-artifacts-backgroundHover"
            onClick={toggleDetails}
          >
            <div className="p-4">
              <div className={showDetails ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="details"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-codinit-elements-artifacts-borderColor h-[1px]" />
            <div className="p-5 text-left bg-codinit-elements-actions-background space-y-4">
              {/* Summary Statistics */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-codinit-elements-textSecondary text-xs mb-1">Total</div>
                  <div className="text-codinit-elements-textPrimary font-medium">{summary.total}</div>
                </div>
                <div>
                  <div className="text-codinit-elements-textSecondary text-xs mb-1">Passed</div>
                  <div className="text-codinit-elements-icon-success font-medium">{summary.passed}</div>
                </div>
                <div>
                  <div className="text-codinit-elements-textSecondary text-xs mb-1">Failed</div>
                  <div className="text-codinit-elements-icon-error font-medium">{summary.failed}</div>
                </div>
                <div>
                  <div className="text-codinit-elements-textSecondary text-xs mb-1">Skipped</div>
                  <div className="text-codinit-elements-textTertiary font-medium">{summary.skipped}</div>
                </div>
              </div>

              {/* Coverage Section */}
              {testArtifact.coverage && (
                <div className="space-y-2">
                  <div className="text-codinit-elements-textPrimary text-sm font-medium">Coverage</div>
                  <CoverageBar label="Lines" percentage={testArtifact.coverage.lines} />
                  <CoverageBar label="Statements" percentage={testArtifact.coverage.statements} />
                  <CoverageBar label="Functions" percentage={testArtifact.coverage.functions} />
                  <CoverageBar label="Branches" percentage={testArtifact.coverage.branches} />
                </div>
              )}

              {/* Failed Tests */}
              {hasFailures && testArtifact.failedTests && testArtifact.failedTests.length > 0 && (
                <div className="space-y-2">
                  <div className="text-codinit-elements-icon-error text-sm font-medium flex items-center gap-2">
                    <div className="i-ph:warning-circle-fill"></div>
                    Failed Tests
                  </div>
                  <div className="space-y-3">
                    {testArtifact.failedTests.map((test, index) => (
                      <div
                        key={index}
                        className="border border-codinit-elements-borderColor rounded p-3 bg-codinit-elements-background-depth-1"
                      >
                        <div className="text-codinit-elements-textPrimary text-sm font-medium mb-1">{test.name}</div>
                        <button
                          onClick={() => handleFileClick(test.file)}
                          className="text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary text-xs mb-2 flex items-center gap-1 hover:underline"
                        >
                          <div className="i-ph:file-text"></div>
                          {test.file}:{test.line}
                        </button>
                        <div className="text-codinit-elements-icon-error text-xs font-mono whitespace-pre-wrap">
                          {test.error}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-codinit-elements-borderColor">
                <div className="text-codinit-elements-textSecondary text-xs">
                  {new Date(testArtifact.timestamp).toLocaleTimeString()}
                </div>
                <button
                  onClick={handleRerun}
                  disabled={isRunning}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-codinit-elements-button-primary-background hover:bg-codinit-elements-button-primary-backgroundHover text-codinit-elements-button-primary-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <div className={isRunning ? 'i-svg-spinners:90-ring-with-bg' : 'i-ph:arrow-clockwise'}></div>
                  {isRunning ? 'Running...' : 'Re-run Tests'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface CoverageBarProps {
  label: string;
  percentage: number;
}

function CoverageBar({ label, percentage }: CoverageBarProps) {
  const getColor = (pct: number) => {
    if (pct >= 80) {
      return 'bg-codinit-elements-icon-success';
    }

    if (pct >= 50) {
      return 'bg-yellow-500';
    }

    return 'bg-codinit-elements-icon-error';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-codinit-elements-textSecondary text-xs w-20">{label}</div>
      <div className="flex-1 bg-codinit-elements-background-depth-2 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-codinit-elements-textPrimary text-xs w-12 text-right font-medium">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}

function getStatusIconColor(status: TestArtifactState['status'], hasFailures: boolean) {
  if (status === 'running') {
    return 'text-codinit-elements-loader-progress';
  }

  if (status === 'complete' && !hasFailures) {
    return 'text-codinit-elements-icon-success';
  }

  return 'text-codinit-elements-icon-error';
}

function getSummaryBadgeClass(status: TestArtifactState['status'], hasFailures: boolean) {
  if (status === 'running') {
    return 'bg-blue-500/10 text-blue-500';
  }

  if (status === 'complete' && !hasFailures) {
    return 'bg-green-500/10 text-green-500';
  }

  return 'bg-red-500/10 text-red-500';
}
