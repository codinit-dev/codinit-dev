import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { vercelConnection } from '~/lib/stores/vercel';
import { workbenchStore } from '~/lib/stores/workbench';
import { alertsStore } from '~/lib/stores/alerts';
import { webcontainer } from '~/lib/webcontainer';
import { path } from '~/utils/path';
import { useState } from 'react';
import type { ActionCallbackData } from 'codinit-agent/message-parser';
import { makePartId } from 'codinit-agent/partId';
import { chatId } from '~/lib/persistence/useChatHistory';

export function useVercelDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);
  const vercelConn = useStore(vercelConnection);
  const currentChatId = useStore(chatId);

  const handleVercelDeploy = async () => {
    if (!vercelConn.user || !vercelConn.token) {
      toast.error('Please connect to Vercel first in the settings tab!');
      return false;
    }

    if (!currentChatId) {
      toast.error('No active chat found');
      return false;
    }

    try {
      setIsDeploying(true);

      const artifact = workbenchStore.firstArtifact;

      if (!artifact) {
        throw new Error('No active project found');
      }

      // Create a deployment artifact for visual feedback
      const deploymentId = `deploy-vercel-project`;
      const partId = makePartId(deploymentId, 0);
      workbenchStore.addArtifact({
        id: deploymentId,
        partId,
        title: 'Vercel Deployment',
        type: 'standalone',
      });

      const deployArtifact = workbenchStore.artifacts.get()[deploymentId];

      // Notify that build is starting
      alertsStore.setDeployAlert({
        type: 'info',
        title: 'Vercel Deployment',
        description: 'Building project...',
        stage: 'building',
        buildStatus: 'running',
        source: 'vercel',
      });

      const actionId = 'build-' + Date.now();
      const actionData: ActionCallbackData = {
        partId: makePartId('vercel-build', 0),
        artifactId: artifact.id,
        actionId,
        action: {
          type: 'build' as const,
          content: 'npm run build',
        },
      };

      // Add the action first
      artifact.runner.addAction(actionData);

      // Run the build action
      await artifact.runner.runAction(actionData, { isStreaming: false });

      if (!artifact.runner.buildOutput) {
        // Notify that build failed
        alertsStore.setDeployAlert({
          type: 'error',
          title: 'Vercel Deployment Failed',
          description: 'Build failed. Check the terminal for details.',
          stage: 'building',
          buildStatus: 'failed',
          source: 'vercel',
        });
        throw new Error('Build failed');
      }

      // Notify that build succeeded and deployment is starting
      alertsStore.setDeployAlert({
        type: 'info',
        title: 'Vercel Deployment',
        description: 'Build successful. Starting deployment...',
        stage: 'building',
        buildStatus: 'complete',
        deployStatus: 'running',
        source: 'vercel',
      });

      // Get the build files
      const container = await webcontainer;

      // Remove /home/project from buildPath if it exists
      const buildPath = artifact.runner.buildOutput.path.replace('/home/project', '');

      // Check if the build path exists
      let finalBuildPath = buildPath;

      // List of common output directories to check if the specified build path doesn't exist
      const commonOutputDirs = [buildPath, '/dist', '/build', '/out', '/output', '/.next', '/public'];

      // Verify the build path exists, or try to find an alternative
      let buildPathExists = false;

      for (const dir of commonOutputDirs) {
        try {
          await container.fs.readdir(dir);
          finalBuildPath = dir;
          buildPathExists = true;
          console.log(`Using build directory: ${finalBuildPath}`);
          break;
        } catch (error) {
          console.log(`Directory ${dir} doesn't exist, trying next option. ${error}`);

          // Directory doesn't exist, try the next one
          continue;
        }
      }

      if (!buildPathExists) {
        throw new Error('Could not find build output directory. Please check your build configuration.');
      }

      // Get all files recursively
      async function getAllFiles(dirPath: string): Promise<Record<string, string>> {
        const files: Record<string, string> = {};
        const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isFile()) {
            const content = await container.fs.readFile(fullPath, 'utf-8');

            // Remove build path prefix from the path
            const deployPath = fullPath.replace(finalBuildPath, '');
            files[deployPath] = content;
          } else if (entry.isDirectory()) {
            const subFiles = await getAllFiles(fullPath);
            Object.assign(files, subFiles);
          }
        }

        return files;
      }

      const fileContents = await getAllFiles(finalBuildPath);

      // Use chatId instead of artifact.id
      const existingProjectId = localStorage.getItem(`vercel-project-${currentChatId}`);

      const response = await fetch('/api/vercel-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: existingProjectId || undefined,
          files: fileContents,
          token: vercelConn.token,
          chatId: currentChatId,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok || !data.deploy || !data.project) {
        console.error('Invalid deploy response:', data);

        // Notify that deployment failed
        alertsStore.setDeployAlert({
          type: 'error',
          title: 'Vercel Deployment Failed',
          description: data.error || 'Invalid deployment response',
          stage: 'deploying',
          deployStatus: 'failed',
          source: 'vercel',
        });
        throw new Error(data.error || 'Invalid deployment response');
      }

      if (data.project) {
        localStorage.setItem(`vercel-project-${currentChatId}`, data.project.id);
      }

      // Notify that deployment completed successfully
      alertsStore.setDeployAlert({
        type: 'success',
        title: 'Vercel Deployment Complete',
        description: 'Your project has been deployed successfully!',
        stage: 'complete',
        deployStatus: 'complete',
        url: data.deploy.url,
        source: 'vercel',
      });

      return true;
    } catch (err) {
      console.error('Vercel deploy error:', err);
      toast.error(err instanceof Error ? err.message : 'Vercel deployment failed');

      return false;
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    isDeploying,
    handleVercelDeploy,
    isConnected: !!vercelConn.user,
  };
}
