import { motion } from 'framer-motion';
import React, { Suspense, useState } from 'react';
import ConnectionDiagnostics from './ConnectionDiagnostics';
import { Button } from '~/components/ui/Button';
import VercelConnection from './VercelConnection';

// Use React.lazy for dynamic imports
const GitHubConnection = React.lazy(() => import('./GithubConnection'));
const NetlifyConnection = React.lazy(() => import('./NetlifyConnection'));
const CloudflareConnection = React.lazy(() => import('./CloudflareConnection'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4 bg-codinit-elements-background-depth-1 dark:bg-gray-800/50 rounded-lg border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor">
    <div className="flex items-center justify-center gap-2 text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary">
      <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
      <span>Loading connection...</span>
    </div>
  </div>
);

export default function ConnectionsTab() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <div className="i-ph:plugs-connected w-5 h-5 text-codinit-elements-item-contentAccent dark:text-codinit-elements-item-contentAccent" />
          <h2 className="text-lg font-medium text-codinit-elements-textPrimary dark:text-codinit-elements-textPrimary">
            Connection Settings
          </h2>
        </div>
        <Button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          variant="outline"
          className="flex items-center gap-2 hover:bg-codinit-elements-item-backgroundActive/10 hover:text-codinit-elements-textPrimary dark:hover:bg-codinit-elements-item-backgroundActive/10 dark:hover:text-codinit-elements-textPrimary transition-colors"
        >
          {showDiagnostics ? (
            <>
              <div className="i-ph:eye-slash w-4 h-4" />
              Hide Diagnostics
            </>
          ) : (
            <>
              <div className="i-ph:wrench w-4 h-4" />
              Troubleshoot Connections
            </>
          )}
        </Button>
      </motion.div>
      <p className="text-sm text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary">
        Manage your external service connections and integrations
      </p>

      {/* Diagnostics Tool - Conditionally rendered */}
      {showDiagnostics && <ConnectionDiagnostics />}

      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<LoadingFallback />}>
          <GitHubConnection />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <NetlifyConnection />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <VercelConnection />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <CloudflareConnection />
        </Suspense>
      </div>

      {/* Additional help text */}
      <div className="text-sm text-codinit-elements-textSecondary dark:text-codinit-elements-textSecondary bg-codinit-elements-background-depth-2 dark:bg-gray-800/50 p-4 rounded-lg">
        <p className="flex items-center gap-1 mb-2">
          <span className="i-ph:lightbulb w-4 h-4 text-codinit-elements-icon-success dark:text-codinit-elements-icon-success" />
          <span className="font-medium">Troubleshooting Tip:</span>
        </p>
        <p className="mb-2">
          If you're having trouble with connections, try using the troubleshooting tool at the top of this page. It can
          help diagnose and fix common connection issues.
        </p>
        <p>For persistent issues:</p>
        <ol className="list-decimal list-inside pl-4 mt-1">
          <li>Check your browser console for errors</li>
          <li>Verify that your tokens have the correct permissions</li>
          <li>Try clearing your browser cache and cookies</li>
          <li>Ensure your browser allows third-party cookies if using integrations</li>
        </ol>
      </div>
    </div>
  );
}
