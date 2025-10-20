# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodinIT.dev is an AI-powered full-stack development platform that runs in the browser or as an Electron desktop app. It provides an integrated development environment with live preview, WebContainer sandboxing, AI chat with 19+ LLM providers, and deployment capabilities.

## Development Commands

### Essential Commands
```bash
# Development
pnpm run dev              # Start development server with hot reload (requires Chrome Canary if using Chrome)
pnpm run build            # Build for production
pnpm run start            # Run built application locally with Wrangler Pages
pnpm run preview          # Build and start for production testing

# Testing & Quality
pnpm test                 # Run test suite with Vitest
pnpm run test:watch       # Run tests in watch mode
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Run ESLint with auto-fix
pnpm run typecheck        # Run TypeScript type checking
pnpm run typegen          # Generate Wrangler types

# Docker
pnpm run dockerbuild      # Build development Docker image
docker compose --profile development up  # Run with Docker Compose
pnpm run dockerbuild:prod # Build production Docker image

# Electron Desktop App
pnpm electron:build:mac   # Build for macOS
pnpm electron:build:win   # Build for Windows
pnpm electron:build:linux # Build for Linux
pnpm electron:build:dist  # Build for all platforms

# Deployment
pnpm run deploy           # Build and deploy to Cloudflare Pages
```

### Important Notes
- **CRITICAL**: Use `pnpm` exclusively as the package manager (packageManager: pnpm@10.0.0)
  - Never use npm or yarn - this can cause dependency conflicts
- Node.js version requirement: >=20.15.1
- Chrome 129 has a known issue; use Chrome Canary for local development
- For Ollama and LMStudio, use `127.0.0.1` instead of `localhost` to avoid IPv6 issues

## Architecture Overview

### Tech Stack
- **Framework**: Remix v2 with Vite
- **Runtime**: Cloudflare Pages (Cloudflare Workers runtime)
- **Styling**: UnoCSS with SCSS support
- **UI Components**: Radix UI primitives with custom components
- **State Management**: Nanostores for reactive state
- **Code Editor**: CodeMirror 6 with syntax highlighting via Shiki
- **Terminal**: xterm.js for integrated terminal
- **WebContainer**: @webcontainer/api for sandboxed Node.js runtime in browser
- **Desktop**: Electron for native desktop application

### Directory Structure

```
app/
├── components/         # React components organized by feature
│   ├── chat/          # AI chat interface components
│   ├── workbench/     # Code editor and file management
│   ├── editor/        # CodeMirror editor components
│   ├── sidebar/       # Navigation and history
│   ├── header/        # Top navigation bar
│   ├── deploy/        # Deployment integrations
│   ├── git/           # Git version control UI
│   ├── @settings/     # Settings panels and configuration
│   └── ui/            # Reusable UI primitives
├── lib/
│   ├── .server/       # Server-side only code
│   │   └── llm/       # LLM streaming and AI logic
│   ├── stores/        # Nanostores state management
│   ├── modules/       # Core business logic modules
│   │   └── llm/       # LLM provider system (base-provider, registry, manager)
│   ├── webcontainer/  # WebContainer integration
│   ├── persistence/   # Local storage and data persistence
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── runtime/       # Runtime environment handling
│   └── services/      # External service integrations
├── routes/            # Remix file-based routing
│   ├── _index.tsx     # Home page
│   └── api.*.ts       # API endpoints
├── types/             # TypeScript type definitions
└── utils/             # Shared utilities

electron/              # Electron desktop app code
├── main/             # Main process
└── preload/          # Preload scripts

docs/                 # Documentation site
```

### Key Architectural Patterns

#### LLM Provider System
The application uses a modular provider architecture located in `app/lib/modules/llm/`:

- **BaseProvider** (`base-provider.ts`): Abstract class that all LLM providers extend
- **Manager** (`manager.ts`): Orchestrates provider registration and model instantiation
- **Registry** (`registry.ts`): Central registration of all provider classes
- **Providers** (`providers/`): Individual provider implementations (OpenAI, Anthropic, Google, etc.)

Each provider class defines:
- Static models (pre-configured models)
- Dynamic models (loaded from provider API)
- API key configuration
- Model instance creation

To add a new LLM provider, create a class extending `BaseProvider` and register it in the registry.

#### State Management
Uses Nanostores (`app/lib/stores/`) for reactive state:

- **workbench.ts**: File system, editor state, preview URLs (~29KB - complex)
- **files.ts**: File operations, diff tracking, locking system (~28KB - complex)
- **chat.ts**: Chat messages and conversation state
- **settings.ts**: User preferences and provider configuration (~10KB)
- **logs.ts**: Application logging with categorization (~12KB)
- **previews.ts**: Preview server management (~8KB)
- **terminal.ts**: Terminal session management
- **theme.ts**: Theme switching and persistence
- **editor.ts**: Editor-specific state and configuration
- **netlify.ts**: Netlify deployment state
- **supabase.ts**: Supabase connection and database state
- **vercel.ts**: Vercel deployment state
- **profile.ts**: User profile information
- **streaming.ts**: Streaming state management
- **mcp.ts**: Model Context Protocol configuration

Stores are framework-agnostic and can be subscribed to from any component using `@nanostores/react`.

#### Server-Side AI Streaming
Located in `app/lib/.server/llm/`:

- **stream-text.ts**: Main streaming logic for AI responses (~10KB)
- **stream-recovery.ts**: Handles stream interruption recovery
- **switchable-stream.ts**: Allows switching between models mid-stream
- **create-summary.ts**: Generates conversation summaries (~6KB)
- **select-context.ts**: Context selection for prompts (~8KB)

These files run only on the server (Cloudflare Workers) and handle AI SDK integration.

#### WebContainer Integration
The app uses WebContainer API (`app/lib/webcontainer/`) to provide:
- In-browser Node.js runtime
- File system operations
- Terminal command execution
- Live preview server

WebContainer enables running development servers (Vite, Next.js, etc.) entirely in the browser.

#### Route Architecture
Remix file-based routing in `app/routes/`:

- `_index.tsx`: Main application page
- `api.chat.ts`: AI chat streaming endpoint (~16KB)
- `api.github-*.ts`: GitHub integration endpoints (user, stats, branches, templates)
- `api.gitlab-*.ts`: GitLab integration endpoints (projects, branches)
- `api.netlify-*.ts`: Netlify deployment endpoints
- `api.supabase-*.ts`: Supabase database integration (user, query, variables)
- `api.vercel-*.ts`: Vercel deployment endpoints
- `api.models.ts`: Dynamic model loading
- `api.enhancer.ts`: Prompt enhancement
- `api.bug-report.ts`: Bug reporting functionality
- `api.check-env-key.ts`: Environment key validation
- `api.configured-providers.ts`: Lists configured LLM providers
- `api.system.diagnostics.ts`: System diagnostics and health checks
- `api.system.disk-info.ts`: Disk usage and file system information
- `api.llmcall.ts`: Direct LLM API calls
- `api.local-template.ts`: Local template management
- `api.mcp-*.ts`: Model Context Protocol endpoints
- `api.git-*.ts`: Git proxy and repository information

API routes return streaming responses or JSON depending on the endpoint.

## Configuration Files

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

**AI Providers**:
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`
- `GROQ_API_KEY`, `MISTRAL_API_KEY`, `COHERE_API_KEY`
- `DEEPSEEK_API_KEY`, `XAI_API_KEY`, `PERPLEXITY_API_KEY`
- And 10+ more providers

**Local Models**:
- `OLLAMA_API_BASE_URL` (use `http://127.0.0.1:11434`)
- `LMSTUDIO_API_BASE_URL` (use `http://127.0.0.1:1234`)

**Service Integrations** (all prefixed with `VITE_` for client access):
- `VITE_GITHUB_ACCESS_TOKEN`: GitHub integration
- `VITE_GITLAB_ACCESS_TOKEN`: GitLab integration
- `VITE_VERCEL_ACCESS_TOKEN`: Vercel deployment
- `VITE_NETLIFY_ACCESS_TOKEN`: Netlify deployment
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: Supabase backend

**Auto-Connection**: Services with `VITE_` prefixed tokens will auto-connect on startup if tokens are provided in `.env.local`.

**Docker Setup**:
For Docker, `.env` file is required for variable substitution. Either:
- Run `./scripts/setup-env.sh` to sync `.env.local` to `.env`
- Manually copy: `cp .env.local .env`

### TypeScript Configuration
- Path alias: `~/*` maps to `./app/*`
- Target: ESNext with Bundler module resolution
- Strict mode enabled
- Types: Remix, Cloudflare Workers, Electron, Vite

### Vite Configuration
`vite.config.ts` includes:
- Node.js polyfills for browser (buffer, process, stream)
- Git metadata injection (commit hash, branch, author)
- Package.json data injection as build-time constants
- UnoCSS integration
- Chrome 129 workaround middleware
- Environment variable prefixes: `VITE_`, `OLLAMA_API_BASE_URL`, `LMSTUDIO_API_BASE_URL`, etc.

### Cloudflare Workers
`wrangler.toml`:
- Compatibility flags: `nodejs_compat`
- Build output: `./build/client`
- Metrics disabled

## Component Guidelines

### UI Components
Located in `app/components/ui/`:
- Built with Radix UI primitives
- Styled with UnoCSS utility classes
- TypeScript interfaces for props
- Support both light and dark themes via `data-theme` attribute

### Feature Components
Organized by domain:
- **Chat**: Message display, input, AI response rendering
- **Workbench**: File tree, editor panels, preview iframe
- **Editor**: CodeMirror integration, language support, autocomplete
- **Settings**: Provider configuration, API key management, service connections

Use `ClientOnly` from `remix-utils/client-only` for browser-only components.

## Testing

- Test framework: Vitest with jsdom
- Test files: Co-located with source files or in `__tests__` directories
- Testing Library: React Testing Library for component tests
- Commands:
  - Run all tests: `pnpm test`
  - Run single test file: `pnpm test path/to/file.test.ts`
  - Run tests in watch mode: `pnpm run test:watch`
  - Run tests matching a pattern: `pnpm test --grep "pattern"`

## MCP (Model Context Protocol)

CodinIT supports MCP for extending AI capabilities:
- Configuration stored in `app/lib/stores/mcp.ts`
- Server types: STDIO, SSE, Streamable HTTP
- Tool execution requires user approval
- MCP SDK: `@modelcontextprotocol/sdk`

## Common Development Patterns

### Adding a New LLM Provider
1. Create provider class in `app/lib/modules/llm/providers/your-provider.ts`
2. Extend `BaseProvider` and implement required methods
3. Add to `app/lib/modules/llm/registry.ts`
4. Add environment variable to `.env.example`
5. Test with API key in settings

### Adding a New Route
1. Create file in `app/routes/` following Remix conventions
2. Export `loader` for GET requests, `action` for POST/PUT/DELETE
3. Use `json()` or streaming responses
4. Server-only code imports from `.server` modules

### Working with Stores
```typescript
import { useStore } from '@nanostores/react';
import { myStore } from '~/lib/stores/myStore';

function MyComponent() {
  const value = useStore(myStore);
  // Component re-renders when store changes
}
```

### File Operations
Use stores in `app/lib/stores/files.ts`:
- `filesStore`: File content and metadata
- File locking system prevents conflicts
- Diff tracking for version control
- Auto-save and manual save modes

## Deployment Targets

1. **Cloudflare Pages** (primary): `pnpm run deploy`
2. **Docker**: Multi-stage Dockerfile with development and production targets
3. **Electron**: Desktop apps for macOS, Windows, Linux
4. **Vercel/Netlify**: Via integrated deployment features

## Known Issues & Workarounds

- **Chrome 129**: Has Vite module loading bug. Use Chrome Canary for development.
- **IPv6 Localhost**: Ollama and LMStudio don't work with `localhost`, use `127.0.0.1`
- **Docker env**: Requires both `.env.local` and `.env` files
- **WebContainer**: Limited to browser environments, not available in Electron main process

## Git Workflow

- Main branch: `main`
- Git integration for import/export projects
- GitHub and GitLab repository management
- Automatic diff visualization
- Version history tracking

### Commit Workflow
- After each file edit, add and commit the file immediately once completed
- Do NOT include "Co-authored by Claude" or similar AI attributions in commit messages
- Keep commits focused and atomic - one logical change per commit
- Use clear, descriptive commit messages that explain the "why" not just the "what"
