# Agent Guidelines for Codinit App

This document outlines the essential commands and code style guidelines for AI agents operating within this repository.

## Commands

*   **Build**: `pnpm run build`
*   **Lint**: `pnpm run lint`
*   **Lint Fix**: `pnpm run lint:fix`
*   **Test All**: `pnpm run test`
*   **Test Single File**: `pnpm vitest <path/to/your/test.test.ts>`
*   **Type Check**: `pnpm run typecheck`

## Code Style

*   **Formatting**: Enforced by Prettier. Key rules: `printWidth: 120`, `singleQuote: true`, `tabWidth: 2`, `semi: true`.
*   **Linting**: Enforced by ESLint. Follows `eslint:recommended` and `plugin:prettier/recommended`. `no-console` is allowed.
*   **TypeScript**: Strict typing is enforced. Use `strict: true`, `forceConsistentCasingInFileNames: true`, `isolatedModules: true`, `verbatimModuleSyntax: true`.
*   **Imports**: Use path aliases: `~/*` for `./app/*`, `~/docs*` for `./docs/*`, `#build/*` for `./build/*`.
*   **Naming Conventions**: Follow established patterns in existing code.
*   **Error Handling**: Implement robust error handling as seen in existing modules.
