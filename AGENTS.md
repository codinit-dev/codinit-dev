# Build/Lint/Test Commands

## Build Commands
- `pnpm run build` - Production build with Remix Vite
- `pnpm run dev` - Development server with hot reload
- `pnpm run typecheck` - TypeScript type checking

## Test Commands
- `pnpm run test` - Run all tests once with Vitest
- `pnpm run test:watch` - Run tests in watch mode
- `vitest --run path/to/test.spec.ts` - Run single test file

## Lint Commands
- `pnpm run lint` - ESLint check with caching
- `pnpm run lint:fix` - Auto-fix ESLint + Prettier formatting

# Code Style Guidelines

## Formatting (Prettier)
- Print width: 120 characters
- Single quotes for strings
- 2 spaces for indentation (no tabs)
- Semicolons required
- Bracket spacing enabled

## TypeScript
- Strict mode enabled
- ESNext target with JSX transform (react-jsx)
- Path aliases: `~/*` maps to `./app/*`
- Explicit return types for functions
- Interface definitions for component props

## Imports
- Organize imports automatically (Biome)
- Group imports: React, third-party, local
- Use absolute imports with `~/` prefix
- No unused imports (error level)

## Naming Conventions
- camelCase: variables, functions, hooks
- PascalCase: components, types, interfaces
- UPPER_SNAKE_CASE: constants
- kebab-case: file names

## Error Handling
- Use try-catch blocks for async operations
- Log errors with createScopedLogger
- Return error objects instead of throwing
- Handle loading/error states in components

## Testing
- Vitest with jsdom environment
- Coverage thresholds: 70% for all metrics
- Test files: `*.test.ts`, `*.spec.ts`
- Setup file: `__tests__/config/setup.ts`