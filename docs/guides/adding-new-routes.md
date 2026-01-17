# Adding New Routes

This guide covers how to add new authenticated pages using [TanStack Router](https://tanstack.com/router).

## File Naming

TanStack Router uses file-based routing. Place route files in `web/src/routes/`:

| File Pattern | URL Path | Description |
|--------------|----------|-------------|
| `_auth.dashboard/route.tsx` | `/dashboard` | Route with folder (colocated files) |
| `_auth.settings.tsx` | `/settings` | Single-file route |
| `_auth.logs.tsx` | `/logs` | Single-file route |

The `_auth` prefix indicates layout routes that require authentication.

## Creating a New Route

### 1. Create the route file

```tsx
// web/src/routes/_auth.my-page.tsx
import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'

export const Route = createFileRoute('/_auth/my-page')({
  component: MyPage,
})

function MyPage() {
  return (
    <DashboardLayout
      title="My Page"
      description="Description shown under the title."
    >
      <div className="px-4 lg:px-6">
        <p>Content here</p>
      </div>
    </DashboardLayout>
  )
}
```

### 2. Add navigation (optional)

Add a link in the sidebar by editing `web/src/components/app-sidebar.tsx`:

```tsx
const navItems = [
  // ... existing items
  {
    title: 'My Page',
    url: '/my-page',
    icon: IconSomeIcon,
  },
]
```

## DashboardLayout Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Page title (h2 heading) |
| `description` | `string` | No | Subtitle text |
| `children` | `ReactNode` | Yes | Page content |

## Content Spacing

The `DashboardLayout` provides consistent outer structure. For content that needs horizontal padding:

```tsx
<DashboardLayout title="Example">
  {/* Full-width content (e.g., data tables) */}
  <DataTable data={data} />

  {/* Padded content */}
  <div className="px-4 lg:px-6">
    <Card>...</Card>
  </div>
</DashboardLayout>
```

## Route with Folder Structure

For routes with colocated data or sub-components, use a folder:

```
web/src/routes/_auth.my-page/
├── route.tsx          # Main route component
├── data.json          # Colocated data
└── components/        # Route-specific components
    └── my-widget.tsx
```

## TanStack Router Features

### Data Loading

Use `loader` to fetch data before the route renders:

```tsx
export const Route = createFileRoute('/_auth/my-page')({
  loader: async () => {
    const data = await fetchMyData()
    return { data }
  },
  component: MyPage,
})

function MyPage() {
  const { data } = Route.useLoaderData()
  // ...
}
```

### Search Params

Define and validate URL search parameters:

```tsx
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  filter: z.string().optional(),
})

export const Route = createFileRoute('/_auth/my-page')({
  validateSearch: searchSchema,
  component: MyPage,
})

function MyPage() {
  const { page, filter } = Route.useSearch()
  // ...
}
```

### Route Context

The `_auth` layout provides auth context to all child routes:

```tsx
function MyPage() {
  const { auth } = Route.useRouteContext()
  // auth.user, auth.isAdmin, etc.
}
```

### Navigation

Use the `Link` component for type-safe navigation:

```tsx
import { Link } from '@tanstack/react-router'

<Link to="/settings">Settings</Link>
<Link to="/my-page" search={{ page: 2 }}>Page 2</Link>
```

## Protected Routes

All routes under `_auth` automatically require authentication. The `_auth.tsx` layout handles redirecting unauthenticated users.

## Resources

- [TanStack Router Docs](https://tanstack.com/router/latest/docs/overview)
- [File-Based Routing](https://tanstack.com/router/latest/docs/file-based-routing)
- [Data Loading](https://tanstack.com/router/latest/docs/data-loading)
