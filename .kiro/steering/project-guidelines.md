# CodinIT.dev Project Guidelines

This steering file provides project-specific context and guidelines for AI interactions within the CodinIT.dev repository.

## Project Overview

CodinIT.dev is an AI-assisted development environment that runs in WebContainers, supporting 19+ AI providers and enabling real-time code generation, editing, and deployment.

## Key Technologies

- **Frontend**: React 18 + TypeScript + Remix
- **Styling**: Tailwind CSS + UnoCSS + CVA
- **State**: Nanostores + Zustand
- **Testing**: Vitest + Playwright
- **AI**: AI SDK with multi-provider support
- **Deployment**: Cloudflare Pages, Vercel, Netlify

## Development Standards

### Code Quality
- Follow TypeScript strict mode
- Use path aliases (`~/` for app, `codinit-agent/*` for workspace)
- Maintain 70%+ test coverage
- Follow ESLint + Prettier configuration

### Component Patterns
- Use CVA for styling variants
- Implement proper error boundaries
- Follow React performance best practices
- Use proper TypeScript interfaces

### Testing Requirements
- Write both unit and integration tests
- Use Vitest for component testing
- Use Playwright for E2E testing
- Colocate tests with components

## WebContainer Constraints

- No native binaries or pip packages
- Use web-compatible alternatives
- Always install dependencies before file operations
- Graceful degradation for unsupported features

## Security Guidelines

- Never commit API keys or secrets
- Validate all inputs with Zod schemas
- Use user-friendly error messages
- Implement proper rate limiting

## Performance Considerations

- Leverage tree shaking and code splitting
- Use React.memo and useMemo appropriately
- Implement virtual scrolling for large lists
- Monitor bundle size regularly