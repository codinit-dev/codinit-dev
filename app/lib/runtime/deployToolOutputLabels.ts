export type OutputLabels = 'codinitTypecheck' | 'frontendTypecheck' | 'codinitDeploy';

export const outputLabels: Record<OutputLabels, string> = {
  codinitTypecheck: 'codinit typecheck',
  frontendTypecheck: 'frontend typecheck',
  codinitDeploy: 'codinit deploy',
};
