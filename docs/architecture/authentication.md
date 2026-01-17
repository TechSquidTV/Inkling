# Authentication Architecture

The application uses a multi-layered authentication system supporting OIDC and API Keys.

## Strategies

### 1. OIDC (OpenID Connect)
Used for user login via self-hosted identity providers (e.g., Keycloak, Dex).
- **Flow**: Authorization Code Flow.
- **Provider Discovery**: Automated via `/.well-known/openid-configuration`.
- **User Provisioning**: New users are automatically created in the database upon successful OIDC callback.

### 2. JWT (JSON Web Token)
Used for internal session management after OIDC login.
- **Algorithm**: HS256.
- **Storage**: Client-side (typically in a secure cookie or local storage).

### 3. API Keys
Used for programmatic access to the API.
- **Header**: `X-API-Key`.
- **Storage**: SHA256 hashed in the database.
- **Format**: `ink_<hex_bytes>`.

## Precedence
1. `X-API-Key` Header
2. `Authorization: Bearer <JWT>` Header

## Models

### User
- `Email`: Unique email from OIDC provider.
- `InternalID`: The `sub` claim from OIDC (null for email/password users).
- `Role`: User role - `admin` or `user`. First user is automatically admin.

### APIKey
- `KeyHash`: SHA256 hash.
- `UserID`: Reference to the user.
- `Scopes`: JSON string of allowed actions.
- `ExpiresAt`: Optional expiration time.

## User Roles

See [User Roles Guide](../guides/user-roles.md) for detailed documentation on the role system.

- **First User = Admin**: Automatically assigned on registration.
- **Admin Middleware**: Use `middleware.RequireAdmin(ctx)` to protect admin-only endpoints.
- **Registration Control**: Admins can disable new user registration.

## Middleware
The `AuthMiddleware` in `internal/middleware` handles token verification and user lookup, injecting the `User` object into the context.

## Huma Integration
- Security schemes (`bearerAuth`, `apiKey`) are defined in OpenAPI spec.
- Public endpoints are tagged with `public`.

## Frontend Protected Routes

The frontend implementation uses **TanStack Router** and a custom **AuthContext** to protect sensitive routes like `/dashboard`.

### 1. AuthContext
The `AuthProvider` (in `web/src/lib/auth.tsx`) manages the user's authentication state using a JWT stored in `localStorage`. 

### 2. Router Context
The authentication state is passed to the router via the `context` property in `createRouter` (in `web/src/main.tsx`). This context is typed in `web/src/routes/__root.tsx`.

### 3. BeforeLoad Hook
Routes that require authentication use the `beforeLoad` hook to check the context.
```tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: Dashboard,
})
```
If `isAuthenticated` is `false`, the user is redirected to the login page (`/`).
