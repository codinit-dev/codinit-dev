# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodinIT.dev is an AI-powered full-stack web development platform that runs entirely in the browser using WebContainers. It allows users to choose from 19+ LLM providers (OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Mistral, Ollama, etc.) and build complete Node.js applications through conversational AI.

**Key Technologies:**
- **Framework:** Remix (React) on Cloudflare Pages
- **Runtime:** WebContainer API (in-browser Node.js environment)
- **State Management:** Nanostores
- **Styling:** UnoCSS + TailwindCSS
- **AI SDK:** Vercel AI SDK
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Desktop App:** Electron

## Development Commands

### Essential Commands
```bash
# Development
pnpm install              # Install dependencies
pnpm run dev             # Start dev server (localhost:5173)
pnpm run build           # Production build
pnpm run preview         # Build and preview production locally

# Code Quality
pnpm test                # Run Vitest test suite
pnpm run typecheck       # TypeScript type checking
pnpm run lint            # ESLint check
pnpm run lint:fix        # Auto-fix linting issues + Prettier

# Deployment
pnpm run deploy          # Deploy to Cloudflare Pages
pnpm run start           # Run production build with Wrangler

# Docker
pnpm run dockerbuild     # Build development image
pnpm run dockerbuild:prod # Build production image
pnpm run dockerrun       # Run container

# Electron Desktop App
pnpm electron:build:mac  # Build macOS app
pnpm electron:build:win  # Build Windows app
pnpm electron:build:linux # Build Linux app
pnpm electron:build:dist # Build all platforms
```

### Running Single Tests
```bash
pnpm test <test-file-path>           # Run specific test file
pnpm test -- --watch                 # Run in watch mode
```

## Architecture Overview

### Core Application Structure

**app/** - Main application code
- **routes/** - Remix route handlers and API endpoints
  - `api.chat.ts` - Main chat streaming endpoint with context optimization
  - `api.*.ts` - API routes for providers, deployment, git operations, etc.
  - `chat.$id.tsx` - Chat interface route

- **lib/** - Core business logic
  - **modules/llm/** - LLM provider abstraction layer
    - `manager.ts` - Singleton managing all LLM providers
    - `base-provider.ts` - Abstract base class for providers
    - `providers/` - Individual provider implementations (19+ providers)
    - `registry.ts` - Auto-registration of providers
  - **stores/** - Nanostores for client state (chat, editor, settings, github, netlify, etc.)
  - **runtime/** - Core execution engine
    - `action-runner.ts` - Executes AI-generated actions in WebContainer
    - `message-parser.ts` - Parses AI responses into structured actions
  - **.server/llm/** - Server-side LLM utilities
    - `stream-text.ts` - Main streaming logic with token management
    - `select-context.ts` - Context optimization for large codebases
    - `create-summary.ts` - Conversation summarization
  - **webcontainer/** - WebContainer API integration
  - **persistence/** - Local/remote data persistence

- **components/** - React components
  - `chat/` - Chat interface components
  - `workbench/` - Editor, terminal, preview panels
  - `@settings/` - Settings panels for providers/configuration

- **types/** - TypeScript type definitions
- **utils/** - Utility functions

### LLM Provider System

The provider system uses a plugin architecture with automatic registration:

1. **Base Provider** (`app/lib/modules/llm/base-provider.ts`): Abstract class defining provider interface
2. **Provider Implementations** (`app/lib/modules/llm/providers/*.ts`): Each provider extends BaseProvider
3. **Registry** (`app/lib/modules/llm/registry.ts`): Auto-imports and exports all providers
4. **Manager** (`app/lib/modules/llm/manager.ts`): Singleton that registers and manages providers

**Adding a new provider:**
1. Create `app/lib/modules/llm/providers/new-provider.ts` extending `BaseProvider`
2. Export the class from `registry.ts`
3. Add API key to `.env.example`
4. Provider auto-registers on startup

### Message Flow

1. User sends message → `api.chat.ts`
2. Context optimization (if enabled) → `select-context.ts`
3. Stream text with selected model → `stream-text.ts`
4. Parse AI response → `message-parser.ts`
5. Execute actions → `action-runner.ts` in WebContainer
6. Update UI stores → Nanostores (chat, editor, etc.)

### Action System

AI responses are parsed into structured actions:
- **File operations**: Create, update, delete files
- **Shell commands**: Execute in WebContainer terminal
- **Supabase queries**: Database operations
- **Deployments**: Netlify, Vercel, GitHub Pages

Actions are executed sequentially by `ActionRunner` in the WebContainer environment.

## Key Constraints & Patterns

### WebContainer Limitations
- **No native binaries** - Only JavaScript/WebAssembly
- **No pip/g++/git** - Limited Python (stdlib only), no C++ compiler, no git CLI
- **Prefer Node.js scripts** over shell scripts
- **Use Vite** for web servers (not custom implementations)
- **Databases**: Prefer libsql, sqlite (no native binaries)

### Code Style
- Use TypeScript strict mode
- Nanostores for state management (not React state for global state)
- Server code in `.server/` directories (tree-shakeable)
- Scoped loggers via `createScopedLogger()`

### Environment Variables
- Client vars: `VITE_*` prefix
- Server vars: Standard naming
- Provider base URLs: Configure via `.env.local`
- See `.env.example` for complete reference

### Testing
- Framework: Vitest
- Tests adjacent to source files (`.spec.ts`)
- Preview tests (Playwright) in `tests/preview/` are excluded by default

### File Organization
- Route handlers: `app/routes/`
- Shared components: `app/components/`
- Business logic: `app/lib/`
- Types: `app/types/`
- Utils: `app/utils/`

## Important Implementation Details

### Context Optimization
When enabled, `select-context.ts` intelligently selects relevant files to include in the LLM context based on:
- File similarity to user query
- Token limits per provider
- File importance heuristics

### Stream Recovery
`stream-recovery.ts` handles LLM stream timeouts/failures with automatic retry logic.

### Provider Settings
- Stored in cookies (client-side)
- Auto-enabled when environment variables present
- Configurable via Settings UI (`app/components/@settings/`)

### WebContainer Integration
- Singleton instance shared across app
- File system operations via WebContainer API
- Shell execution in isolated terminal instances

### Model Context Protocol (MCP)
- MCP server integration for enhanced tool use
- Service: `app/lib/services/mcpService.ts`
- Config: User-managed MCP server connections

## Deployment Options

- **Cloudflare Pages** (primary): `pnpm run deploy`
- **Netlify/Vercel**: Direct deployment from UI
- **Docker**: Multi-stage builds for dev/prod
- **Electron**: Native desktop apps for macOS/Windows/Linux

## Contributing Guidelines

1. Branch from `main` (or `stable` for production-ready changes)
2. Follow existing code patterns and TypeScript conventions
3. Test changes manually (automated tests where applicable)
4. Keep PRs focused on single features/fixes
5. Update documentation if adding new features

## Common Development Tasks

### Adding a New LLM Provider
1. Create provider class in `app/lib/modules/llm/providers/`
2. Export from `registry.ts`
3. Add environment variable to `.env.example`
4. Update provider settings UI if needed

### Adding API Routes
1. Create `app/routes/api.<name>.ts`
2. Export `action` or `loader` function
3. Handle errors and return appropriate responses

### Modifying System Prompts
- Main prompt: `app/lib/common/prompts/prompts.ts`
- Discuss mode: `app/lib/common/prompts/discuss-prompt.ts`
- Prompt library: `app/lib/common/prompt-library.ts`

### Working with Stores
```typescript
// Reading
const value = storeName.get()

// Writing
storeName.set({ ...value, newProp: 'value' })

// Subscribing (React)
const value = useStore(storeName)
```

## Important Files to Know

- `app/lib/.server/llm/stream-text.ts` - Core AI streaming logic
- `app/lib/runtime/action-runner.ts` - Action execution engine
- `app/lib/modules/llm/manager.ts` - Provider management
- `app/routes/api.chat.ts` - Main chat API endpoint
- `app/utils/constants.ts` - Global constants and defaults
- `vite.config.ts` - Vite configuration with polyfills
- `.env.example` - Complete environment variable reference
