import type { BuildMetadata, VerificationConfig, VerificationResult } from './types';
import { verifySignature } from './collector';

/**
 * Verifies build metadata and returns verification result
 */
export function verifyBuild(metadata: BuildMetadata, config: VerificationConfig = {}): VerificationResult {
  const { mode = 'warn', verbose = false, requiredEnvVars = [], allowedBuilders = [] } = config;

  const messages: string[] = [];
  let passed = true;

  // Check if build is marked as official
  if (!metadata.isOfficial) {
    messages.push('⚠️  This is an UNOFFICIAL build');
    messages.push(`   Built by: ${metadata.builder}`);
    messages.push(`   Environment: ${metadata.environment}`);
    passed = false;
  } else {
    messages.push('✓ Official build verified');

    if (verbose) {
      messages.push(`  Commit: ${metadata.commit.slice(0, 7)}`);
      messages.push(`  Branch: ${metadata.branch}`);
      messages.push(`  Built: ${metadata.timestamp}`);
      messages.push(`  Builder: ${metadata.builder}`);
    }
  }

  // Verify signature if present
  if (metadata.signature) {
    const signatureValid = verifySignature(metadata, metadata.signature);

    if (!signatureValid) {
      messages.push('❌ Build signature verification FAILED');
      passed = false;
    } else if (verbose) {
      messages.push('✓ Build signature verified');
    }
  } else if (metadata.isOfficial) {
    messages.push('⚠️  No signature found for official build');
  }

  // Check required environment variables
  if (requiredEnvVars.length > 0) {
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      messages.push(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
      passed = false;
    }
  }

  // Check allowed builders
  if (allowedBuilders.length > 0 && !allowedBuilders.includes(metadata.builder)) {
    messages.push(`⚠️  Builder '${metadata.builder}' is not in the allowed list`);
    passed = false;
  }

  // Check for development builds
  if (metadata.branch !== 'main' && metadata.branch !== 'master' && metadata.isOfficial) {
    messages.push(`ℹ️  Development build from branch: ${metadata.branch}`);
  }

  // Add build provenance information
  if (verbose) {
    messages.push('\nBuild Provenance:');
    messages.push(`  Commit: ${metadata.commit}`);
    messages.push(`  Branch: ${metadata.branch}`);
    messages.push(`  Timestamp: ${metadata.timestamp}`);
    messages.push(`  Builder: ${metadata.builder}`);
    messages.push(`  Environment: ${metadata.environment}`);

    if (metadata.buildNumber) {
      messages.push(`  Build #: ${metadata.buildNumber}`);
    }

    if (metadata.tags && metadata.tags.length > 0) {
      messages.push(`  Tags: ${metadata.tags.join(', ')}`);
    }
  }

  const result: VerificationResult = {
    isOfficial: metadata.isOfficial,
    metadata,
    messages,
    passed: mode === 'warn' ? true : passed,
  };

  return result;
}

/**
 * Perform verification and handle the result based on configuration
 */
export function performVerification(metadata: BuildMetadata, config: VerificationConfig = {}): void {
  const result = verifyBuild(metadata, config);
  const { mode = 'warn', customMessage } = config;

  // Always log verification results
  if (result.messages.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('CodinIT Build Verification');
    console.log('='.repeat(60));
    result.messages.forEach((msg) => console.log(msg));
    console.log('='.repeat(60) + '\n');
  }

  // Add custom message if provided
  if (customMessage) {
    console.log(customMessage + '\n');
  }

  // Handle enforcement mode
  if (mode === 'enforce' && !result.passed) {
    console.error('\n❌ BUILD VERIFICATION FAILED');
    console.error('This build did not pass verification checks.');
    console.error('Official builds must be created through the authorized CI/CD pipeline.\n');

    if (!result.isOfficial) {
      console.error('To create an official build:');
      console.error('1. Ensure you are building in the authorized CI/CD environment');
      console.error('2. Set OFFICIAL_BUILD=true environment variable');
      console.error('3. Provide BUILD_SIGNING_SECRET for signature verification\n');
    }

    process.exit(1);
  } else if (!result.isOfficial && mode === 'warn') {
    console.warn('\n⚠️  UNOFFICIAL BUILD NOTICE');
    console.warn('This build was not created through the official CI/CD pipeline.');
    console.warn('While it will function normally, users should prefer official releases');
    console.warn('from https://github.com/gerome-elassaad/codinit-app/releases\n');
  }
}

/**
 * Create a verification middleware for runtime checks
 */
export function createVerificationMiddleware(config: VerificationConfig = {}) {
  return function verificationMiddleware(metadata: BuildMetadata) {
    const result = verifyBuild(metadata, config);

    return {
      isOfficial: result.isOfficial,
      metadata: result.metadata,
      getWarnings: () => result.messages.filter((m) => m.includes('⚠️') || m.includes('ℹ️')),
      getErrors: () => result.messages.filter((m) => m.includes('❌')),
      displayBanner: () => {
        if (!result.isOfficial) {
          return {
            type: 'warning' as const,
            title: 'Unofficial Build',
            message:
              `This build was created by ${metadata.builder} in a ${metadata.environment} environment. ` +
              'For verified official builds, please download from the official releases page.',
            metadata: {
              commit: metadata.commit.slice(0, 7),
              branch: metadata.branch,
              timestamp: new Date(metadata.timestamp).toLocaleString(),
            },
          };
        }

        return null;
      },
    };
  };
}
