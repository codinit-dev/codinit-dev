/**
 * @codinit/build-verification
 *
 * A build verification and provenance system for ensuring build integrity
 * while respecting open-source principles.
 *
 * Features:
 * - Collects build metadata (git commit, branch, builder, timestamp)
 * - Verifies official builds using environment checks and signatures
 * - Allows unofficial builds with clear warnings
 * - Provides build provenance information
 * - Configurable enforcement levels (warn vs enforce)
 */

export { collectBuildMetadata, verifySignature } from './collector';
export { verifyBuild, performVerification, createVerificationMiddleware } from './verifier';
export type { BuildMetadata, VerificationConfig, VerificationResult } from './types';

/**
 * Quick start verification function
 *
 * @example
 * ```ts
 * import { quickVerify } from '@codinit/build-verification';
 *
 * // Collect metadata and verify (warn mode)
 * quickVerify();
 *
 * // Enforce official builds only
 * quickVerify({ mode: 'enforce' });
 * ```
 */
export function quickVerify(config?: import('./types').VerificationConfig): void {
  const { collectBuildMetadata } = require('./collector');
  const { performVerification } = require('./verifier');

  const metadata = collectBuildMetadata();
  performVerification(metadata, config);
}

/**
 * Get build information for display
 *
 * @example
 * ```ts
 * import { getBuildInfo } from '@codinit/build-verification';
 *
 * const info = getBuildInfo();
 * console.log(`Build ${info.commit} by ${info.builder}`);
 * ```
 */
export function getBuildInfo(): import('./types').BuildMetadata {
  const { collectBuildMetadata } = require('./collector');
  return collectBuildMetadata();
}
