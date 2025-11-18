import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import type { CloudflareProject } from '~/types/cloudflare';

// Add loader function to handle GET requests for project info
export async function loader({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const token = url.searchParams.get('token');
  const accountId = url.searchParams.get('accountId');

  if (!projectId || !token || !accountId) {
    return json({ error: 'Missing projectId, token, or accountId' }, { status: 400 });
  }

  try {
    // Get project info
    const projectResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!projectResponse.ok) {
      return json({ error: 'Failed to fetch project' }, { status: 400 });
    }

    const projectData = (await projectResponse.json()) as any;

    // Get latest deployment
    const deploymentsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectId}/deployments?limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const deploymentsData = deploymentsResponse.ok ? ((await deploymentsResponse.json()) as any) : null;
    const latestDeployment = deploymentsData?.result?.[0];

    return json({
      project: {
        id: projectData.result.id,
        name: projectData.result.name,
        url: `https://${projectData.result.name}.pages.dev`,
      },
      deploy: latestDeployment
        ? {
            id: latestDeployment.id,
            url: latestDeployment.url,
            environment: latestDeployment.environment,
            created_on: latestDeployment.created_on,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching Cloudflare deployment:', error);
    return json({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}

interface DeployRequestBody {
  projectId?: string;
  files: Record<string, string>;
  chatId: string;
}

// Existing action function for POST requests
export async function action({ request }: ActionFunctionArgs) {
  try {
    const { projectId, files, token, accountId, chatId } = (await request.json()) as DeployRequestBody & {
      token: string;
      accountId: string;
    };

    if (!token || !accountId) {
      return json({ error: 'Not connected to Cloudflare' }, { status: 401 });
    }

    let targetProjectId = projectId;
    let projectInfo: CloudflareProject | undefined;

    // If no projectId provided, create a new project
    if (!targetProjectId) {
      const projectName = `codinit-dev-${chatId}-${Date.now()}`;
      const createProjectResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            production_branch: 'main',
          }),
        },
      );

      if (!createProjectResponse.ok) {
        const errorData = (await createProjectResponse.json()) as any;
        return json(
          {
            error: `Failed to create project: ${errorData.errors?.[0]?.message || 'Unknown error'}`,
          },
          { status: 400 },
        );
      }

      const newProject = (await createProjectResponse.json()) as any;
      targetProjectId = newProject.result.name;
      projectInfo = {
        id: newProject.result.id,
        name: newProject.result.name,
        url: `https://${newProject.result.name}.pages.dev`,
        chatId,
        created_on: newProject.result.created_on,
        modified_on: newProject.result.modified_on,
      };
    } else {
      // Get existing project info
      const projectResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${targetProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (projectResponse.ok) {
        const existingProject = (await projectResponse.json()) as any;
        projectInfo = {
          id: existingProject.result.id,
          name: existingProject.result.name,
          url: `https://${existingProject.result.name}.pages.dev`,
          chatId,
          created_on: existingProject.result.created_on,
          modified_on: existingProject.result.modified_on,
        };
      } else {
        // If project doesn't exist, create a new one
        const projectName = `codinit-dev-${chatId}-${Date.now()}`;
        const createProjectResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: projectName,
              production_branch: 'main',
            }),
          },
        );

        if (!createProjectResponse.ok) {
          const errorData = (await createProjectResponse.json()) as any;
          return json(
            {
              error: `Failed to create project: ${errorData.errors?.[0]?.message || 'Unknown error'}`,
            },
            { status: 400 },
          );
        }

        const newProject = (await createProjectResponse.json()) as any;
        targetProjectId = newProject.result.name;
        projectInfo = {
          id: newProject.result.id,
          name: newProject.result.name,
          url: `https://${newProject.result.name}.pages.dev`,
          chatId,
          created_on: newProject.result.created_on,
          modified_on: newProject.result.modified_on,
        };
      }
    }

    // Create deployment with files
    const formData = new FormData();

    // Add files to form data
    for (const [filePath, content] of Object.entries(files)) {
      // Skip empty files and directories
      if (!content || content.trim() === '') {
        continue;
      }

      // Create file blob
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob, filePath);
    }

    const deployResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${targetProjectId}/deployments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!deployResponse.ok) {
      const errorData = (await deployResponse.json()) as any;
      return json(
        {
          error: `Deployment failed: ${errorData.errors?.[0]?.message || 'Unknown error'}`,
        },
        { status: 400 },
      );
    }

    const deployData = (await deployResponse.json()) as any;

    return json({
      project: projectInfo,
      deploy: {
        id: deployData.result.id,
        url: deployData.result.url,
        environment: deployData.result.environment,
        created_on: deployData.result.created_on,
      },
    });
  } catch (error) {
    console.error('Cloudflare deploy error:', error);
    return json({ error: error instanceof Error ? error.message : 'Deployment failed' }, { status: 500 });
  }
}
