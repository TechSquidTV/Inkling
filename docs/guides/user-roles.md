# User Roles

The application implements a basic role-based access control system with two roles: **admin** and **user**.

## Role Assignment

- **First User = Admin**: The first user to register (via email/password signup or OIDC) is automatically assigned the `admin` role.
- **Subsequent Users**: All users registered after the first are assigned the `user` role by default.

## Available Roles

| Role | Description |
|------|-------------|
| `admin` | Full access including admin settings |
| `user` | Standard user access |

## Checking User Role

### Backend (Go)

Use the middleware helpers in `internal/middleware/auth.go`:

```go
import "github.com/techsquidtv/inkling/internal/middleware"

// In your handler:
user, err := middleware.RequireAuth(ctx)  // Returns user or 401
if err != nil {
    return nil, err
}

// For admin-only endpoints:
user, err := middleware.RequireAdmin(ctx)  // Returns user or 401/403
if err != nil {
    return nil, err
}
```

### Frontend (React)

Use the `useAuth()` hook from `@/lib/auth`:

```tsx
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { user, isAdmin } = useAuth()
  
  return (
    <div>
      <p>Role: {user?.role}</p>
      {isAdmin && <AdminOnlyContent />}
    </div>
  )
}
```

## Disabling User Registration

Administrators can disable new user registrations from the Settings page:

1. Log in as an admin user
2. Navigate to **Settings**
3. In the **Admin Settings** section, toggle **User Registration** off

When registration is disabled:
- New signups via `/auth/signup` return `403 Forbidden`
- New OIDC users are blocked with the same error
- Existing users can still log in normally
- The first user can always register (to bootstrap the system)

## Promoting a User to Admin

To manually promote an existing user to admin, update the database directly:

```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

Or via Go:

```go
db.Model(&database.User{}).Where("email = ?", "user@example.com").Update("role", database.RoleAdmin)
```

## API Endpoints

### User Profile

#### GET /api/me
Returns the current user's information including role.

**Response:**
```json
{
  "id": 1,
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin"
}
```

#### PUT /api/me
Update the current user's profile.

**Request:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

#### PUT /api/me/password
Change the current user's password.

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

### Admin Settings

#### GET /api/admin/settings (Admin only)
Returns application settings.

**Response:**
```json
{
  "registration_enabled": true
}
```

#### PUT /api/admin/settings (Admin only)
Updates application settings.

**Request:**
```json
{
  "registration_enabled": false
}
```

### Admin User Management

#### GET /api/admin/users (Admin only)
List all users with optional search.

**Query Parameters:**
- `search` - Filter by email or name
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "users": [
    { "id": 1, "email": "admin@example.com", "name": "Admin", "role": "admin", "created_at": "..." }
  ],
  "total": 1
}
```

#### PUT /api/admin/users/:id (Admin only)
Update a user's role.

**Request:**
```json
{
  "role": "admin"
}
```

#### DELETE /api/admin/users/:id (Admin only)
Delete a user. Cannot delete yourself or the last admin.

### Protected Resources

Products API write operations require admin role:
- `POST /api/products` - Admin only
- `DELETE /api/products/:id` - Admin only

