# .kiro Directory

This directory contains Kiro-specific configuration and files for the CodinIT.dev project.

## Directory Structure

```
.kiro/
├── specs/          # Feature specifications and implementation plans
├── steering/       # Project guidelines and context for AI interactions
├── settings/       # Configuration files (MCP, etc.)
├── hooks/          # Agent automation hooks
└── README.md       # This file
```

## Specs Directory

The `specs/` directory contains feature specifications following the spec-driven development methodology:

- Each feature has its own subdirectory: `.kiro/specs/{feature-name}/`
- Required files per spec:
  - `requirements.md` - User stories and acceptance criteria
  - `design.md` - Technical design and architecture
  - `tasks.md` - Implementation task breakdown

## Steering Directory

The `steering/` directory contains markdown files that provide context and guidelines:

- `project-guidelines.md` - Core project standards and patterns
- Additional steering files can be added for specific domains or features
- Files can be configured for always-included, conditional, or manual inclusion

## Settings Directory

The `settings/` directory contains configuration files:

- `mcp.json` - Model Context Protocol server configurations
- Additional configuration files as needed

## Hooks Directory

The `hooks/` directory contains JSON files defining agent automation:

- Hook files define when and how to trigger agent actions
- Supports file events, prompt events, and manual triggers
- Can execute commands or send prompts to the agent

## Usage

This directory structure supports:

1. **Spec-driven development** - Systematic feature planning and implementation
2. **AI context steering** - Providing relevant project context to AI interactions
3. **Agent automation** - Triggering actions based on IDE events
4. **Configuration management** - Centralized settings for tools and integrations