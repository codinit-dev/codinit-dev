/**
 * Build metadata collected during the build process
 */
export interface BuildMetadata {
  /** Git commit hash */
  commit: string;
  /** Git branch name */
  branch: string;
  /** Build timestamp (ISO 8601) */
  timestamp: string;
  /** Builder identity (CI system, username, etc.) */
  builder: string;
  /** Build environment (CI, local, etc.) */
  environment: string;
  /** Whether this is an official build */
  isOfficial: boolean;
  /** Optional: build number from CI */
  buildNumber?: string;
  /** Optional: git tags */
  tags?: string[];
  /** Optional: signature for verification */
  signature?: string;
}

/**
 * Verification configuration options
 */
export interface VerificationConfig {
  /** Strictness level: 'warn' (default) or 'enforce' */
  mode?: 'warn' | 'enforce';
  /** Custom verification message */
  customMessage?: string;
  /** Whether to log verification results */
  verbose?: boolean;
  /** Required environment variables for official builds */
  requiredEnvVars?: string[];
  /** Allowed builder identities */
  allowedBuilders?: string[];
}

/**
 * Verification result
 */
export interface VerificationResult {
  /** Whether the build is verified as official */
  isOfficial: boolean;
  /** Build metadata */
  metadata: BuildMetadata;
  /** Verification messages/warnings */
  messages: string[];
  /** Whether verification passed all checks */
  passed: boolean;
}
