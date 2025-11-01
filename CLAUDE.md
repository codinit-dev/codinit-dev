# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## project overview

CodinIT is an AI-powered full-stack development platform built with Remix, React, and WebContainers. It enables users to build, manage, and deploy applications directly in the browser or as a desktop Electron app. The platform integrates with 19+ AI providers and features real-time code execution, terminal access, and deployment capabilities.

## development commands

### setup and installation
```bash
pnpm install
```

### development
```bash
pnpm run dev
# Runs pre-start.cjs to set up environment, then starts Remix dev server on http://localhost:5173
```

### building
```bash
pnpm run build
# Builds for web deployment (Cloudflare Pages) with 4GB memory allocation
```

### testing
```bash
pnpm run test           # Run all tests once
pnpm run test:watch     # Run tests in watch mode
vitest run <file>       # Run a single test file
```

### linting and formatting
```bash
pnpm run lint           # Lint app directory with ESLint
pnpm run lint:fix       # Auto-fix lint issues and format with Prettier
pnpm run typecheck      # Run TypeScript type checking
```

**Note**: Pre-commit hooks (husky) automatically run typecheck and lint before each commit. If checks fail, the commit is aborted.

### deployment
```bash
pnpm run deploy         # Build and deploy to Cloudflare Pages via Wrangler
pnpm run start          # Start production server locally (auto-detects OS)
```

### electron desktop app
```bash
pnpm run electron:dev                    # Run Electron in development mode
pnpm run electron:build:mac              # Build macOS app
pnpm run electron:build:win              # Build Windows app
pnpm run electron:build:linux            # Build Linux app
pnpm run electron:build:dist             # Build for all platforms
```

### docker
```bash
pnpm run dockerbuild                     # Build development Docker image
pnpm run dockerbuild:prod                # Build production Docker image
docker compose --profile development up  # Run with Docker Compose
pnpm run dockerrun                       # Run built container on port 5173
```

### email development
```bash
pnpm run email:dev      # Start email preview server on port 3000
pnpm run email:export   # Export email templates to .react-email
```

## architecture

### core structure

- **app/routes/**: Remix routes including API endpoints and page routes
  - `api.chat.ts`: Main chat/LLM interaction endpoint
  - `api.models.$provider.ts`: Dynamic model fetching per provider
  - `chat.$id.tsx`: Chat interface route
  - `webcontainer.*.tsx`: WebContainer iframe routes for isolated execution

- **app/lib/modules/llm/**: LLM provider abstraction layer
  - `manager.ts`: Singleton LLMManager orchestrates all providers
  - `base-provider.ts`: Abstract base class for provider implementations
  - `providers/`: Individual provider implementations (OpenAI, Anthropic, Ollama, etc.)
  - `registry.ts`: Exports all providers for dynamic registration

- **app/lib/runtime/**: Code execution and action handling
  - `action-runner.ts`: Executes actions (file operations, shell commands) in WebContainer
  - `message-parser.ts`: Parses streaming LLM responses for `<exampleArtifact>` and `<exampleAction>` tags

- **app/lib/stores/**: Nanostores-based state management
  - `settings.ts`: Provider settings, API keys, feature flags
  - `editor.ts`: File editor state
  - `workbench.ts`: Terminal, preview, and file tree state

- **app/lib/persistence/**: Data persistence layer
  - `db.ts`: IndexedDB operations for chat history
  - `chats.ts`: Chat CRUD operations
  - `lockedFiles.ts`: File locking system to prevent conflicts

- **app/components/workbench/**: Main workbench UI
  - Terminal integration with xterm.js
  - File editor with CodeMirror
  - Preview pane with iframe isolation
  - File tree with drag-and-drop

### key architectural patterns

**WebContainer integration**: The platform uses StackBlitz WebContainers to run Node.js environments in the browser. Actions from LLM responses trigger file operations and shell commands in isolated containers.

**Provider abstraction**: All AI providers implement `BaseProvider` interface. The `LLMManager` singleton registers providers at startup and handles model list updates, API key management, and dynamic model fetching.

**Streaming response parsing**: LLM responses use XML-like tags (`<exampleArtifact>`, `<exampleAction>`) to structure actions. The `StreamingMessageParser` parses these incrementally and triggers callbacks to the `ActionRunner`.

**Multi-target builds**: The same codebase builds for:
- Cloudflare Pages (SSR with Remix + Vite)
- Electron desktop app (separate Electron main/preload/renderer builds)
- Docker containers (both development and production)

**Environment variable handling**: API keys can be provided via:
1. Server-side environment variables (takes precedence)
2. Client-side settings UI (stored in localStorage)
3. Cookies for session-based keys

## important implementation details

### provider settings
Local providers (Ollama, LMStudio, OpenAILike) are disabled by default. Enable them in settings or via environment variables. The `URL_CONFIGURABLE_PROVIDERS` constant defines which providers support custom base URLs.

**Important**: When using Ollama or LMStudio, avoid `localhost` URLs due to IPv6 issues. Use `127.0.0.1` instead (e.g., `http://127.0.0.1:11434` for Ollama).

### git operations
The platform includes isomorphic-git for in-browser Git operations. Git proxy routes (`api.git-proxy.$.ts`) handle authentication and CORS.

GitHub integration can be configured via `VITE_GITHUB_ACCESS_TOKEN` environment variable. Classic tokens are recommended for broader access. This enables importing private repositories and avoids rate limiting.

### webcontainer routes
Routes prefixed with `webcontainer.` serve isolated iframes for preview and terminal. These use separate Remix loaders to avoid parent page interference.

### file locking
The file locking system (`lockedFiles.ts`) prevents concurrent edits. Check lock status before file operations in actions.

### testing
Tests use Vitest. Test files use `.spec.ts` extension. Snapshot tests exist for message parser (`__snapshots__/`).

### electron specifics
- Main process: `electron/main/`
- Preload scripts: `electron/preload/`
- Renderer uses same Remix app with `vite-electron.config.ts`
- Auto-updates configured via `electron-update.yml` and GitHub releases

### environment configuration
Copy `.env.example` to `.env.local` and add API keys. Required variables for providers are documented inline. Use `VITE_` prefix for client-accessible variables.

**Supabase integration**: Optional Supabase support is available for database operations. Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` if needed. The platform includes data visualization and migration support.

## deployment targets

- **Cloudflare Pages**: Default target, uses Wrangler for deployment
- **Vercel/Netlify**: Alternative deployment via routes (`api.vercel-deploy.ts`, `api.netlify-deploy.ts`)
- **Electron**: Standalone desktop app with auto-update support
- **Docker**: Both development and production builds available

## notable dependencies

- **Remix 2.x**: Full-stack React framework with SSR
- **Vite 5.x**: Build tool and dev server
- **@webcontainer/api**: In-browser Node.js runtime
- **nanostores**: Lightweight state management
- **ai SDK**: Vercel AI SDK for streaming LLM responses
- **CodeMirror 6**: Code editor component
- **xterm.js**: Terminal emulator
- **UnoCSS**: Atomic CSS engine
- **Radix UI**: Accessible component primitives

## common workflows

### adding a new AI provider
1. Create provider class in `app/lib/modules/llm/providers/` extending `BaseProvider`
2. Implement required methods: `getModelList()`, optionally `getDynamicModels()`
3. Export from `registry.ts`
4. Add provider config to `PROVIDER_LIST` in `app/utils/constants.ts`
5. Update `.env.example` with API key variable

### modifying action execution
Actions are defined in `app/types/actions.ts` and executed by `ActionRunner`. The flow:
1. LLM outputs `<exampleAction>` tag
2. `StreamingMessageParser` parses and triggers callback
3. `ActionRunner.addAction()` queues the action
4. `ActionRunner.runAction()` executes in WebContainer

### working with the editor
Editor state lives in `app/lib/stores/editor.ts`. File operations go through `app/lib/stores/files.ts`. Always check file locks before modifications.

### debugging
Set `VITE_LOG_LEVEL=debug` in `.env.local` for verbose logging. Use `createScopedLogger` utility for consistent logging across modules.

### theme system
The codebase uses a consistent CSS custom property naming convention with the `codinit-elements-*` prefix. Theme colors, backgrounds, borders, and text colors are all defined through these CSS variables for easy theming across the entire application.
