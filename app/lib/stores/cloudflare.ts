import { atom } from 'nanostores';
import type { CloudflareConnection } from '~/types/cloudflare';
import { logStore } from './logs';
import { toast } from 'react-toastify';

// Initialize with stored connection or defaults
const storedConnection = typeof window !== 'undefined' ? localStorage.getItem('cloudflare_connection') : null;
const initialConnection: CloudflareConnection = storedConnection
  ? JSON.parse(storedConnection)
  : {
      user: null,
      token: '',
      accountId: '',
      stats: undefined,
    };

export const cloudflareConnection = atom<CloudflareConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);

export const updateCloudflareConnection = (updates: Partial<CloudflareConnection>) => {
  const currentState = cloudflareConnection.get();
  const newState = { ...currentState, ...updates };
  cloudflareConnection.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('cloudflare_connection', JSON.stringify(newState));
  }
};

export async function fetchCloudflareStats(token: string, accountId: string) {
  try {
    isFetchingStats.set(true);

    // Fetch user account info
    const userResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch account: ${userResponse.status}`);
    }

    const userData = (await userResponse.json()) as any;

    // Fetch Pages projects
    const projectsResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projectsData = (await projectsResponse.json()) as any;
    const projects = projectsData.result || [];

    // Get latest deployment for each project
    const projectsWithDeployments = await Promise.all(
      projects.map(async (project: any) => {
        try {
          const deploymentsResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project.name}/deployments?limit=1`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (deploymentsResponse.ok) {
            const deploymentsData = (await deploymentsResponse.json()) as any;
            const latestDeployment = deploymentsData.result?.[0];

            return {
              ...project,
              latest_deployment: latestDeployment,
              url: latestDeployment ? `https://${project.name}.pages.dev` : undefined,
            };
          }

          return project;
        } catch (error) {
          console.error(`Error fetching deployments for project ${project.name}:`, error);
          return project;
        }
      }),
    );

    const currentState = cloudflareConnection.get();
    updateCloudflareConnection({
      ...currentState,
      user: userData.result,
      stats: {
        projects: projectsWithDeployments,
        totalProjects: projectsWithDeployments.length,
      },
    });
  } catch (error) {
    console.error('Cloudflare API Error:', error);
    logStore.logError('Failed to fetch Cloudflare stats', { error });
    toast.error('Failed to fetch Cloudflare statistics');
  } finally {
    isFetchingStats.set(false);
  }
}
