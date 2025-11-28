# Clerk Authentication Setup

CodinIT now uses [Clerk](https://clerk.com/) for authentication. This guide will help you set up Clerk for your development environment.

## Prerequisites

- A Clerk account (sign up at https://clerk.com/)
- Node.js 20.15.1 or higher
- pnpm package manager

## Setup Instructions

### 1. Create a Clerk Application

1. Go to https://dashboard.clerk.com/
2. Click "Add application" or select an existing application
3. Choose your authentication methods (Email, Google, GitHub, etc.)
4. Copy your API keys from the dashboard

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_... # Your publishable key
CLERK_SECRET_KEY=sk_test_...           # Your secret key
```

**Important Notes:**
- `CLERK_PUBLISHABLE_KEY` is prefixed with `VITE_` to make it available on the client-side
- `CLERK_SECRET_KEY` remains server-side only
- Never commit these keys to version control
- Use different keys for development and production

### 3. Development vs Production Keys

Clerk provides different keys for development and production:

**Development:**
- Keys start with `pk_test_` and `sk_test_`
- Use localhost URLs
- More permissive for testing

**Production:**
- Keys start with `pk_live_` and `sk_live_`
- Require verified domains
- Stricter security settings

### 4. Configure Allowed Origins

In your Clerk Dashboard:

1. Go to "Settings" → "Domains"
2. Add your development URL: `http://localhost:5173`
3. Add your production domain when ready to deploy

## Features Enabled

The Clerk integration provides:

- ✅ **Email/Password Authentication**: Users can sign up with email
- ✅ **Social Login**: Google, GitHub, and other OAuth providers (configurable)
- ✅ **Session Management**: Automatic token refresh and session handling
- ✅ **User Profile**: Access to user data (name, email, avatar)
- ✅ **Protected Routes**: Uses `SignedIn` and `SignedOut` components
- ✅ **Modal Authentication**: Sign-in/sign-up in modal dialogs
- ✅ **Electron Support**: Seamless authentication in desktop app with custom protocol handling

## How It Works

### Root Layout (`app/root.tsx`)

The app uses Clerk's `ClerkApp` wrapper and authentication loader:

```typescript
import { ClerkApp } from '@clerk/remix';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/remix';

// Clerk authentication loader
export const loader = async (args: LoaderFunctionArgs) => {
  const { rootAuthLoader } = await import('@clerk/remix/ssr.server');
  return rootAuthLoader(args);
};

// App wrapped with ClerkApp
export default ClerkApp(App, {
  publishableKey: import.meta.env.CLERK_PUBLISHABLE_KEY,
});
```

### Protected Content

Content is protected using Clerk's components:

```typescript
<SignedIn>
  {/* Content for authenticated users */}
  <Outlet />
</SignedIn>

<SignedOut>
  {/* Sign in/up UI for unauthenticated users */}
  <SignInButton />
  <SignUpButton />
</SignedOut>
```

### Accessing User Data

Use Clerk's hooks to access user information:

```typescript
import { useUser } from '@clerk/remix';

function MyComponent() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return <div>Hello, {user.firstName}!</div>;
}
```

## User Store Integration

The app maintains a simplified user store (`app/lib/stores/user.ts`) that can sync with Clerk's user data:

```typescript
import { setClerkUser } from '~/lib/stores/user';

// Sync Clerk user to store
const { user } = useUser();
useEffect(() => {
  if (user) {
    setClerkUser({
      id: user.id,
      emailAddress: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });
  }
}, [user]);
```

## Customization

### Authentication Methods

Configure which sign-in methods to enable in your Clerk Dashboard:

- Email/Password
- Magic Links
- OAuth (Google, GitHub, Microsoft, etc.)
- Phone Number
- Passkeys

### Branding

Customize the appearance in Clerk Dashboard → "Customization":

- Colors and theme
- Logo
- Social login buttons
- Sign-in/up forms

### User Profile Fields

Configure required/optional user fields in Dashboard → "User & Authentication" → "Email, Phone, Username":

- Email (required by default)
- Phone number
- Username
- Name fields
- Custom metadata

## Migration Notes

Previous authentication system used:
- Custom registration forms
- Database-based user storage
- Email verification via Resend

Clerk replaces this with:
- Built-in authentication UI
- Clerk's user management
- Integrated email verification

## Troubleshooting

### "Clerk publishable key is missing"

Make sure `CLERK_PUBLISHABLE_KEY` is set in your `.env` file and the dev server is restarted.

### Authentication redirects not working

Check that your domain is added to allowed origins in Clerk Dashboard.

### User data not showing

Ensure the Clerk loader is properly configured in `root.tsx` and the component using user data is wrapped in `SignedIn`.

### Session not persisting

Check browser console for errors. Clerk uses cookies and local storage for sessions - ensure they're not blocked.

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Remix Integration Guide](https://clerk.com/docs/references/remix/overview)
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [API Reference](https://clerk.com/docs/references/javascript/overview)

## Electron App Integration

CodinIT supports both web and desktop (Electron) authentication using Clerk.

### How Electron Authentication Works

1. **Custom Protocol Handler**: The Electron app registers a `codinit-auth://` protocol
2. **External Sign-In**: When signing in from Electron, the user is redirected to Clerk's hosted UI in their default browser
3. **Callback Handling**: After successful authentication, Clerk redirects back to `codinit-auth://signin-callback`
4. **Cookie Sync**: The Electron main process captures cookies and syncs them to the app session
5. **App Access**: User is automatically signed in to the desktop app

### Electron Configuration

The Electron app automatically handles:
- Protocol registration (`codinit-auth://`)
- Cookie storage and synchronization
- Auth callbacks for sign-in, sign-up, and sign-out
- Session persistence across app restarts

### Setting Up Custom Domain (Optional)

If you're using a custom Clerk domain:

1. Add to `.env`:
   ```bash
   CLERK_DOMAIN=your-domain.clerk.accounts.com
   ```

2. Configure redirect URLs in Clerk Dashboard:
   ```
   codinit-auth://signin-callback
   codinit-auth://signup-callback
   codinit-auth://signout-callback
   ```

### Routes

The app provides dedicated authentication routes:

- `/sign-in` - Clerk's SignIn component for web users
- `/sign-up` - Clerk's SignUp component for web users

Note: Electron users are redirected to the hosted Clerk UI instead of in-app routes.

## Support

If you encounter issues:

1. Check the [Clerk Documentation](https://clerk.com/docs)
2. Visit [Clerk Discord](https://clerk.com/discord)
3. Review [GitHub Issues](https://github.com/anthropics/claude-code/issues)
