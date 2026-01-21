import type { Tool } from 'ai';
import { z } from 'zod';

export const getCodinitDeploymentNameDescription = `
Get the name of the CodinIT deployment this project is using. This tool returns the deployment name that is used
to identify in the dashboard and for deployment operations.

The deployment name is a unique identifier and can be used to access the CodinIT dashboard:
https://dashboard.codinit.dev/d/{deploymentName}.
`;

export const getCodinitDeploymentNameParameters = z.object({});

export const getCodinitDeploymentNameTool: Tool = {
  description: getCodinitDeploymentNameDescription,
  parameters: getCodinitDeploymentNameParameters,
};
