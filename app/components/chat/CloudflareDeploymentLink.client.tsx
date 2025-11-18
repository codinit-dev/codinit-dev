import { useStore } from '@nanostores/react';
import { cloudflareConnection } from '~/lib/stores/cloudflare';
import { chatId } from '~/lib/persistence/useChatHistory';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useEffect, useState } from 'react';

export function CloudflareDeploymentLink() {
  const connection = useStore(cloudflareConnection);
  const currentChatId = useStore(chatId);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchProjectData() {
      if (!connection.token || !connection.accountId || !currentChatId) {
        return;
      }

      // Check if we have a stored project name for this chat
      const projectName = localStorage.getItem(`cloudflare-project-${currentChatId}`);

      if (!projectName) {
        return;
      }

      setIsLoading(true);

      try {
        // Fetch project details from Cloudflare Pages API
        const projectResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${connection.accountId}/pages/projects/${projectName}`,
          {
            headers: {
              Authorization: `Bearer ${connection.token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          },
        );

        if (!projectResponse.ok) {
          throw new Error(`Failed to fetch project: ${projectResponse.status}`);
        }

        const projectData = (await projectResponse.json()) as any;

        if (projectData.result) {
          // Get latest deployment
          const deploymentsResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${connection.accountId}/pages/projects/${projectName}/deployments?limit=1`,
            {
              headers: {
                Authorization: `Bearer ${connection.token}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
            },
          );

          if (deploymentsResponse.ok) {
            const deploymentsData = (await deploymentsResponse.json()) as any;

            if (deploymentsData.result && deploymentsData.result.length > 0) {
              const latestDeployment = deploymentsData.result[0];
              setDeploymentUrl(latestDeployment.url);

              return;
            }
          }

          // Fallback to constructed URL if no deployments found
          setDeploymentUrl(`https://${projectName}.pages.dev`);
        }
      } catch (err) {
        console.error('Error fetching Cloudflare deployment:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectData();
  }, [connection.token, connection.accountId, currentChatId]);

  if (!deploymentUrl) {
    return null;
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <a
            href={deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-codinit-elements-item-backgroundActive text-codinit-elements-textSecondary hover:text-[#000000] z-50"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className={`i-ph:link w-4 h-4 hover:text-blue-400 ${isLoading ? 'animate-pulse' : ''}`} />
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="px-3 py-2 rounded bg-codinit-elements-background-depth-3 text-codinit-elements-textPrimary text-xs z-50"
            sideOffset={5}
          >
            {deploymentUrl}
            <Tooltip.Arrow className="fill-codinit-elements-background-depth-3" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
