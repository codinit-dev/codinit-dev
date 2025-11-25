import type { PromptOptions } from '~/lib/common/prompt-library';

export const getCodingRules = (_options: PromptOptions) => {
  return `
<coding_rules>
  These comprehensive coding rules guide all code generation across frameworks and languages. Follow these standards to produce clean, maintainable, secure, and performant code.

  <universal_principles>
    CRITICAL: These principles apply to ALL code regardless of language or framework.

    Clean Code Standards:
      - Write self-documenting code with clear, descriptive names
      - Functions should do one thing and do it well (Single Responsibility)
      - Keep functions small (ideally under 20 lines, max 50 lines)
      - Avoid deep nesting (max 3-4 levels)
      - Use early returns to reduce nesting
      - Prefer composition over inheritance
      - Keep files focused (max 250-300 lines per file)

    SOLID Principles:
      - Single Responsibility: Each module/class has one reason to change
      - Open/Closed: Open for extension, closed for modification
      - Liskov Substitution: Subtypes must be substitutable for base types
      - Interface Segregation: Many specific interfaces over one general
      - Dependency Inversion: Depend on abstractions, not concretions

    DRY, KISS, YAGNI:
      - Don't Repeat Yourself: Extract common logic into reusable functions
      - Keep It Simple: Avoid premature optimization and over-engineering
      - You Aren't Gonna Need It: Only build what's currently needed

    Code Organization:
      - Group related functionality together
      - Organize by feature, not by type
      - Keep related files close in the directory structure
      - Use clear folder hierarchies (max 4-5 levels deep)
      - Separate business logic from UI/presentation
      - Extract constants and configuration to dedicated files

    Naming Conventions:
      - Use descriptive names that reveal intent
      - Boolean variables: use is/has/should prefix (isActive, hasPermission)
      - Functions: use verb-noun format (getUser, createOrder, validateInput)
      - Classes/Components: PascalCase
      - Variables/functions: camelCase
      - Constants: UPPER_SNAKE_CASE
      - Private members: prefix with underscore or use # in modern JS

    Error Handling:
      - Always handle errors, never silently fail
      - Use specific error types, not generic Error
      - Provide context in error messages
      - Log errors with appropriate severity levels
      - Fail fast: validate inputs early
      - Clean up resources in finally blocks or use try-with-resources
      - Return error objects instead of throwing when appropriate

    Comments:
      - Code should be self-explanatory; comments explain WHY not WHAT
      - Document complex algorithms or business rules
      - Use JSDoc/TSDoc for public APIs
      - Remove commented-out code (use version control instead)
      - Keep comments up-to-date with code changes
      - Avoid obvious comments that just restate the code
  </universal_principles>

  <typescript_standards>
    CRITICAL: Use TypeScript for all JavaScript/TypeScript projects with strict mode enabled.

    Type Safety:
      - Enable strict mode in tsconfig.json
      - Avoid \`any\` type - use \`unknown\` if type is truly unknown
      - Use \`as const\` for literal types
      - Leverage type inference - don't over-annotate
      - Use discriminated unions for variant types
      - Prefer \`readonly\` for immutable data
      - Use \`Required\`, \`Partial\`, \`Pick\`, \`Omit\` utility types

    Interfaces vs Types:
      - Use interfaces for object shapes that might be extended
      - Use types for unions, intersections, and mapped types
      - Prefer interfaces for public APIs (better error messages)
      - Use type for derived types and complex transformations

    Generics:
      - Use generics to create reusable, type-safe components
      - Constrain generics with extends when needed
      - Use descriptive names (T for single type, TKey/TValue for key-value)
      - Avoid over-using generics - keep it simple

    Type Guards:
      - Use type predicates for custom type guards
      - Leverage typeof, instanceof for runtime checks
      - Use discriminated unions with literal types
      - Validate external data (API responses) with runtime checks

    Enums vs Union Types:
      - Prefer const enums or union types over regular enums
      - Use string literal unions for better type safety
      - Enums create runtime code, union types don't

    Example:
      <example>
        // Good: Discriminated union with type guards
        type Result<T> =
          | { success: true; data: T }
          | { success: false; error: string };

        function processResult<T>(result: Result<T>): T {
          if (result.success) {
            return result.data;
          }
          throw new Error(result.error);
        }

        // Good: Utility types
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
        }

        type PublicUser = Omit<User, 'password'>;
        type CreateUserInput = Omit<User, 'id'>;
      </example>
  </typescript_standards>

  <react_patterns>
    CRITICAL: Follow modern React patterns (React 18+) with functional components and hooks.

    Component Design:
      - Use functional components exclusively
      - Keep components small and focused (one responsibility)
      - Extract complex logic into custom hooks
      - Use props destructuring for cleaner code
      - Avoid prop drilling - use composition or context
      - Use children prop for composition patterns
      - Split large components into smaller, composable pieces

    Hooks Best Practices:
      - Follow Rules of Hooks (only at top level, only in React functions)
      - Use useState for local component state
      - Use useReducer for complex state logic
      - Extract reusable logic into custom hooks
      - Name custom hooks with "use" prefix
      - Clean up side effects in useEffect return function
      - Specify all dependencies in useEffect dependency array
      - Use useCallback for functions passed to child components
      - Use useMemo for expensive computations only

    State Management:
      - Keep state as local as possible
      - Lift state only when needed
      - Use Context for global state (theme, auth, etc.)
      - Consider Zustand/Jotai for complex app state
      - Avoid Redux unless truly necessary
      - Use server state libraries (React Query, SWR) for API data
      - Separate server state from client state

    Performance Optimization:
      - Use React.memo for expensive pure components
      - Wrap callbacks with useCallback when passing to memoized children
      - Use useMemo for expensive calculations
      - Don't optimize prematurely - measure first
      - Use key prop correctly in lists (stable, unique IDs)
      - Code split with lazy() and Suspense
      - Virtualize long lists with react-window or similar

    Error Boundaries:
      - Wrap top-level components with error boundaries
      - Create specific error boundaries for critical sections
      - Provide fallback UI for errors
      - Log errors to monitoring service

    Forms:
      - Use controlled components for form inputs
      - Consider React Hook Form or Formik for complex forms
      - Validate on blur for better UX
      - Show validation errors inline
      - Disable submit while validating/submitting

    Example:
      <example>
        // Good: Custom hook with proper dependencies
        function useUserData(userId: string) {
          const [user, setUser] = useState<User | null>(null);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState<Error | null>(null);

          useEffect(() => {
            let cancelled = false;

            async function fetchUser() {
              try {
                setLoading(true);
                const data = await api.getUser(userId);
                if (!cancelled) {
                  setUser(data);
                  setError(null);
                }
              } catch (err) {
                if (!cancelled) {
                  setError(err as Error);
                }
              } finally {
                if (!cancelled) {
                  setLoading(false);
                }
              }
            }

            fetchUser();
            return () => { cancelled = true; };
          }, [userId]);

          return { user, loading, error };
        }
      </example>
  </react_patterns>

  <framework_specific_rules>
    Next.js (App Router):
      - Use Server Components by default
      - Add 'use client' only when needed (interactivity, hooks, browser APIs)
      - Fetch data in Server Components, not in useEffect
      - Use generateMetadata for SEO
      - Use route handlers for API endpoints
      - Leverage streaming with Suspense boundaries
      - Use Server Actions for mutations
      - Implement proper loading.tsx and error.tsx
      - Use parallel routes for complex layouts

    Vue 3:
      - Use Composition API with script setup
      - Use ref for reactive primitives, reactive for objects
      - Use computed for derived state
      - Use watchEffect for side effects without explicit dependencies
      - Extract logic into composables (Vue's hooks)
      - Use provide/inject for dependency injection
      - Leverage Teleport for portals
      - Use defineProps with TypeScript for type safety

    Angular:
      - Use standalone components (Angular 14+)
      - Leverage dependency injection properly
      - Use OnPush change detection for performance
      - Create small, focused services
      - Use RxJS operators properly (avoid nested subscriptions)
      - Unsubscribe from observables (use takeUntil pattern)
      - Use async pipe in templates
      - Leverage signals (Angular 16+) for reactive state

    Svelte/SvelteKit:
      - Use reactive statements ($:) for derived values
      - Keep stores minimal and focused
      - Use context for component tree communication
      - Leverage transitions and animations
      - Use actions for reusable DOM behaviors
      - Implement proper error handling in load functions
      - Use form actions for mutations

    Node.js/Express:
      - Use async/await over callbacks
      - Implement proper error handling middleware
      - Validate input with schemas (Zod, Joi)
      - Use environment variables for configuration
      - Implement rate limiting and security headers
      - Use connection pooling for databases
      - Stream large responses
      - Implement proper logging (structured logs)
      - Use clustering for CPU-intensive tasks
  </framework_specific_rules>

  <api_design>
    RESTful Principles:
      - Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
      - Use resource-based URLs (/users/:id, not /getUser)
      - Return appropriate status codes (200, 201, 400, 401, 403, 404, 500)
      - Use plural nouns for collections (/users, not /user)
      - Implement pagination for list endpoints
      - Use query params for filtering and sorting
      - Version your API (/v1/users or via headers)
      - Return consistent error format across endpoints

    GraphQL Best Practices:
      - Keep schema focused and cohesive
      - Use meaningful names for queries and mutations
      - Implement proper error handling (don't return null for errors)
      - Use DataLoader for batching and caching
      - Implement pagination (cursor-based preferred)
      - Use input types for mutations
      - Validate inputs before execution
      - Implement proper authorization at field level

    Error Handling:
      - Return consistent error format (status, message, code, details)
      - Don't leak sensitive information in errors
      - Use specific error codes for client handling
      - Log errors server-side with context
      - Return validation errors with field-level details

    Response Format:
      - Use consistent envelope (data, error, metadata)
      - Include pagination metadata (total, page, pageSize, hasMore)
      - Use ISO 8601 for dates
      - Use null for missing optional fields
      - Document response shapes with examples

    Example:
      <example>
        // Good: Consistent error response
        {
          "error": {
            "code": "VALIDATION_ERROR",
            "message": "Invalid request data",
            "details": [
              {
                "field": "email",
                "message": "Must be a valid email address"
              }
            ]
          }
        }

        // Good: Paginated response
        {
          "data": [...],
          "pagination": {
            "page": 1,
            "pageSize": 20,
            "total": 156,
            "hasMore": true
          }
        }
      </example>
  </api_design>

  <database_patterns>
    SQL Best Practices:
      - Use parameterized queries (prevent SQL injection)
      - Create indexes on frequently queried columns
      - Avoid SELECT * - specify needed columns
      - Use transactions for multi-step operations
      - Implement soft deletes for audit trails
      - Use foreign keys to enforce referential integrity
      - Normalize to 3NF, denormalize selectively for performance
      - Use EXPLAIN to analyze query performance

    NoSQL Patterns:
      - Design schema around access patterns
      - Denormalize data for read performance
      - Use embedded documents for 1-to-few relationships
      - Use references for 1-to-many relationships
      - Implement pagination with cursors, not skip/limit
      - Create indexes for all query patterns
      - Use TTL for temporary data
      - Batch writes for performance

    ORM Usage:
      - Use migrations for schema changes
      - Avoid N+1 queries (use eager loading)
      - Use raw queries for complex operations
      - Implement connection pooling
      - Use transactions for consistency
      - Create indexes in migrations
      - Use seed data for development
      - Validate data at application level

    Query Optimization:
      - Avoid queries in loops (N+1 problem)
      - Use batch operations when possible
      - Cache frequently accessed data
      - Use database views for complex queries
      - Partition large tables
      - Monitor slow query logs
      - Use appropriate data types

    Example:
      <example>
        // Bad: N+1 query problem
        const users = await db.users.findMany();
        for (const user of users) {
          user.posts = await db.posts.findMany({ where: { userId: user.id } });
        }

        // Good: Eager loading
        const users = await db.users.findMany({
          include: { posts: true }
        });
      </example>
  </database_patterns>

  <security_standards>
    CRITICAL: Security is non-negotiable. Always implement these practices.

    OWASP Top 10:
      - SQL Injection: Use parameterized queries/ORMs
      - XSS: Sanitize all user input, escape output
      - CSRF: Use CSRF tokens for state-changing operations
      - Insecure Auth: Use proven auth libraries, never roll your own
      - Security Misconfiguration: Keep dependencies updated
      - Sensitive Data Exposure: Encrypt sensitive data at rest
      - Insufficient Logging: Log security events
      - Broken Access Control: Check permissions on every request
      - Using Components with Known Vulnerabilities: Regular dependency audits
      - Insufficient Attack Protection: Implement rate limiting

    Authentication/Authorization:
      - Hash passwords with bcrypt/argon2 (never store plain text)
      - Use secure session management
      - Implement proper logout (invalidate tokens)
      - Use HTTPS everywhere
      - Implement password complexity requirements
      - Add 2FA for sensitive operations
      - Use JWT with short expiration
      - Refresh tokens should be long-lived and rotated
      - Check authorization on every protected endpoint

    Input Validation:
      - Validate on both client and server
      - Use schema validation (Zod, Joi, Yup)
      - Whitelist allowed values, don't blacklist
      - Validate file uploads (type, size, content)
      - Sanitize HTML input
      - Limit request body size
      - Validate URL parameters and query strings

    XSS Prevention:
      - Escape all user-generated content
      - Use Content Security Policy headers
      - Sanitize HTML with libraries (DOMPurify)
      - Use framework auto-escaping (React, Vue)
      - Avoid dangerouslySetInnerHTML unless necessary
      - Validate and sanitize rich text input

    CSRF Prevention:
      - Use CSRF tokens for all state-changing requests
      - Check Origin/Referer headers
      - Use SameSite cookie attribute
      - Require re-authentication for sensitive operations

    Secure Data Handling:
      - Never log sensitive data (passwords, tokens, PII)
      - Encrypt sensitive data at rest
      - Use HTTPS for data in transit
      - Implement proper key management
      - Use environment variables for secrets
      - Rotate secrets regularly
      - Implement data retention policies

    Example:
      <example>
        // Good: Password hashing
        import bcrypt from 'bcrypt';

        async function createUser(email: string, password: string) {
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

          return db.users.create({
            data: {
              email,
              password: hashedPassword
            }
          });
        }

        // Good: Input validation
        const createUserSchema = z.object({
          email: z.string().email(),
          password: z.string().min(12).max(128),
          name: z.string().min(2).max(100)
        });

        function createUserHandler(req, res) {
          const result = createUserSchema.safeParse(req.body);
          if (!result.success) {
            return res.status(400).json({ errors: result.error.issues });
          }
          // Proceed with validated data
        }
      </example>
  </security_standards>

  <testing_standards>
    Unit Testing:
      - Test one thing per test
      - Use descriptive test names (describe what, not how)
      - Follow Arrange-Act-Assert pattern
      - Use test.each for parameterized tests
      - Mock external dependencies
      - Test edge cases and error conditions
      - Aim for 80%+ code coverage
      - Keep tests fast (under 100ms per test)

    Integration Testing:
      - Test component interactions
      - Use real database (with test data)
      - Test API endpoints end-to-end
      - Test authentication flows
      - Test error scenarios
      - Clean up test data after each test
      - Use factories for test data creation

    E2E Testing:
      - Test critical user journeys
      - Use realistic data
      - Test on multiple browsers/devices
      - Keep E2E tests minimal (slowest tests)
      - Use page object pattern
      - Run in CI/CD pipeline
      - Take screenshots on failure

    Test Organization:
      - Colocate tests with code (__tests__ or .test.ts)
      - Use test utilities and helpers
      - Share test fixtures
      - Use beforeEach/afterEach for setup/cleanup
      - Group related tests with describe blocks

    Mocking:
      - Mock external services and APIs
      - Don't mock what you don't own (test real code)
      - Use MSW for API mocking
      - Verify mock calls and arguments
      - Reset mocks between tests

    Example:
      <example>
        // Good: Well-structured test
        describe('UserService', () => {
          describe('createUser', () => {
            it('should create user with hashed password', async () => {
              // Arrange
              const userData = {
                email: 'test@example.com',
                password: 'SecurePass123!'
              };

              // Act
              const user = await userService.createUser(userData);

              // Assert
              expect(user.email).toBe(userData.email);
              expect(user.password).not.toBe(userData.password);
              expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash
            });

            it('should throw error for duplicate email', async () => {
              // Arrange
              const userData = { email: 'existing@example.com', password: 'pass' };
              await userService.createUser(userData);

              // Act & Assert
              await expect(
                userService.createUser(userData)
              ).rejects.toThrow('Email already exists');
            });
          });
        });
      </example>
  </testing_standards>

  <performance_optimization>
    Frontend Performance:
      - Lazy load routes and components
      - Implement code splitting at route level
      - Optimize images (WebP, responsive sizes, lazy loading)
      - Use CDN for static assets
      - Minimize bundle size (analyze with webpack-bundle-analyzer)
      - Remove unused dependencies
      - Use dynamic imports for heavy libraries
      - Implement service worker for caching
      - Use resource hints (preload, prefetch, preconnect)
      - Minimize render-blocking resources

    Backend Performance:
      - Use caching extensively (Redis, in-memory)
      - Implement database query optimization
      - Use connection pooling
      - Add indexes to frequently queried columns
      - Batch database operations
      - Use pagination for large datasets
      - Implement rate limiting
      - Use CDN for static content
      - Profile and optimize hot paths
      - Use background jobs for heavy tasks

    Caching Strategies:
      - Cache at multiple levels (browser, CDN, server, database)
      - Use cache invalidation strategies
      - Implement stale-while-revalidate
      - Cache API responses with appropriate TTL
      - Use ETags for conditional requests
      - Implement cache warming for critical data

    Bundle Optimization:
      - Tree-shake unused code
      - Use production builds
      - Enable minification and compression
      - Use modern build tools (Vite, esbuild)
      - Analyze and reduce bundle size
      - Split vendor bundles
      - Use dynamic imports for conditional code

    List Performance:
      - Virtualize long lists (react-window, react-virtual)
      - Implement pagination or infinite scroll
      - Use stable keys for list items
      - Debounce search/filter operations
      - Optimize list item rendering

    Example:
      <example>
        // Good: Code splitting with lazy loading
        import { lazy, Suspense } from 'react';

        const HeavyComponent = lazy(() => import('./HeavyComponent'));

        function App() {
          return (
            <Suspense fallback={<Loading />}>
              <HeavyComponent />
            </Suspense>
          );
        }

        // Good: Debounced search
        import { useDeferredValue } from 'react';

        function SearchResults({ query }: { query: string }) {
          const deferredQuery = useDeferredValue(query);
          const results = useSearch(deferredQuery);

          return <ResultList results={results} />;
        }
      </example>
  </performance_optimization>

  <architecture_patterns>
    Layered Architecture:
      - Presentation Layer: UI components, no business logic
      - Business Logic Layer: Core domain logic, validation
      - Data Access Layer: Database queries, external APIs
      - Infrastructure Layer: Logging, config, utilities
      - Keep layers decoupled (depend on interfaces)

    Feature-Based Organization:
      - Group by feature, not by type
      - Each feature contains all related files
      - Features should be independent
      - Share code through shared/common directory
      - Avoid circular dependencies

    Module Organization:
      - Keep related code together
      - Use index files for public exports
      - Hide implementation details
      - Export interfaces, not implementations
      - Use barrel exports sparingly (bundle size)

    Dependency Management:
      - Depend on abstractions, not concretions
      - Use dependency injection
      - Avoid tight coupling between modules
      - Keep dependencies explicit
      - Minimize cross-module dependencies

    Service Layer Pattern:
      - Separate business logic from controllers
      - Create focused services (single responsibility)
      - Use services to orchestrate operations
      - Keep services stateless
      - Use dependency injection for services

    Repository Pattern:
      - Abstract data access behind repositories
      - One repository per aggregate root
      - Keep repositories focused on data operations
      - Don't leak database details to business logic
      - Use interfaces for repositories

    Event-Driven Architecture:
      - Use events for loose coupling
      - Implement event bus/message queue
      - Keep event handlers focused
      - Make events immutable
      - Use event sourcing for audit trails

    Example:
      <example>
        // Good: Feature-based structure
        src/
        ├── features/
        │   ├── auth/
        │   │   ├── components/
        │   │   ├── hooks/
        │   │   ├── services/
        │   │   ├── types.ts
        │   │   └── index.ts
        │   ├── users/
        │   │   ├── components/
        │   │   ├── hooks/
        │   │   ├── services/
        │   │   ├── types.ts
        │   │   └── index.ts
        ├── shared/
        │   ├── components/
        │   ├── hooks/
        │   ├── utils/
        │   └── types/
        └── lib/

        // Good: Service layer with dependency injection
        class UserService {
          constructor(
            private userRepository: IUserRepository,
            private emailService: IEmailService,
            private logger: ILogger
          ) {}

          async createUser(data: CreateUserInput): Promise<User> {
            try {
              const user = await this.userRepository.create(data);
              await this.emailService.sendWelcome(user.email);
              this.logger.info('User created', { userId: user.id });
              return user;
            } catch (error) {
              this.logger.error('Failed to create user', { error });
              throw error;
            }
          }
        }
      </example>
  </architecture_patterns>

  <additional_best_practices>
    Accessibility (a11y):
      - Use semantic HTML elements
      - Add ARIA labels where needed
      - Ensure keyboard navigation works
      - Provide focus indicators
      - Use sufficient color contrast (WCAG AA)
      - Add alt text for images
      - Support screen readers
      - Test with accessibility tools

    Internationalization (i18n):
      - Extract all strings to translation files
      - Use proper date/number formatting
      - Support RTL languages
      - Handle pluralization correctly
      - Use locale-aware sorting
      - Test with different locales

    Documentation:
      - Document public APIs with JSDoc/TSDoc
      - Maintain README with setup instructions
      - Document architecture decisions (ADRs)
      - Keep documentation up-to-date
      - Include code examples
      - Document breaking changes

    Version Control:
      - Write meaningful commit messages
      - Keep commits atomic and focused
      - Use conventional commits format
      - Create feature branches
      - Use pull requests for code review
      - Keep main/master branch stable
      - Tag releases with semantic versioning

    Code Review:
      - Review for logic correctness
      - Check for security vulnerabilities
      - Verify test coverage
      - Ensure code follows conventions
      - Look for performance issues
      - Suggest improvements, not just criticism
      - Approve when standards are met
  </additional_best_practices>
</coding_rules>
`;
};
