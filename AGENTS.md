# Agent Guidelines for Codinit Repository

## Build/Lint/Test Commands
- `pnpm run build` - Build the application
- `pnpm run lint` - Run ESLint on app directory
- `pnpm run lint:fix` - Fix linting issues and format with Prettier
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run test` - Run all tests once
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test <filename>` - Run single test file (e.g., `pnpm run test utils.spec.ts`)

## Code Style Guidelines

### Imports
- Use absolute imports with `~/` prefix instead of relative imports
- Example: `import { utils } from '~/lib/utils'` instead of `import { utils } from '../lib/utils'`
- Group imports: React first, then external libraries, then internal modules

### Formatting
- 2 space indentation, no tabs
- 120 character line length
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line structures

### TypeScript
- Strict mode enabled
- Use type annotations for function parameters and return types
- Prefer `interface` for object shapes, `type` for unions/primitives
- Use `cn()` utility for className merging (from `~/lib/utils`)

### Naming Conventions
- Components: PascalCase (e.g., `Button.tsx`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case for utilities, PascalCase for components

### Error Handling
- Use try-catch blocks for async operations
- Return consistent error types with Zod validation
- Log errors appropriately without exposing sensitive data

### React Patterns
- Use functional components with hooks
- Prefer `classNames()` utility for conditional classes
- Follow existing component patterns (see `app/components/ui/`)
- Use class-variance-authority (cva) for component variants