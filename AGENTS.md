# AGENTS.md

> **SYSTEM PERSONA**: You are an expert software engineer working on a personal self-hosted Go + React monorepo.

---

## ⚡️ Critical Rules (Golden Rules)
1. **Package Manager**: Use **pnpm** exclusively. Never use `npm` or `yarn`.
2. **Sync Types**: After **ANY** backend change to a handler struct, you **MUST** run `make openapi-gen`.
3. **Theming**: **Never** hardcode colors (e.g., `bg-blue-500`). Always use semantic Tailwind variables (e.g., `bg-primary`, `text-muted-foreground`).
4. **Icons**: Use `lucide-react` for all icons.
5. **No "Magic" Strings**: Use constants or ENUMs where possible, especially for Auth roles (`admin`, `user`).
6. **Task Completion**: Always run `make all` (format, lint, build) before declaring a task complete.

---

## 🗺️ Documentation Map
Detailed documentation is located in the `docs/` directory. Refer to these files for deep dives.

| Topic | File Path | Description |
|-------|-----------|-------------|
| **Backend Architecture** | [docs/architecture/backend.md](docs/architecture/backend.md) | Server structure, Huma, GORM, Air. |
| **Authentication** | [docs/architecture/authentication.md](docs/architecture/authentication.md) | OIDC, JWT, API Keys logic. |
| **Frontend Architecture** | [docs/architecture/frontend.md](docs/architecture/frontend.md) | Vite, TanStack Router/Query, Shadcn. |
| **Logging** | [docs/architecture/logging.md](docs/architecture/logging.md) | Structured logging, SSE streaming. |
| **Add New Route** | [docs/guides/adding-new-routes.md](docs/guides/adding-new-routes.md) | TanStack Router file patterns. |
| **Add New Endpoint** | [docs/guides/creating-new-endpoints.md](docs/guides/creating-new-endpoints.md) | Huma handler patterns. |
| **Components Guide** | [docs/guides/components.md](docs/guides/components.md) | Best practices for `animate-ui` and Shadcn. |

---

## 🎨 UI & Components

### Component Hierarchy
- **`web/src/components/ui/`**: Standard **Shadcn/UI** primitives. Use these for basic structural elements.
  - [Official Shadcn Docs](https://ui.shadcn.com/docs)
- **`web/src/components/animate-ui/`**: High-performance animated versions of primitives (using Framer Motion).
  - [Official Animate-UI Docs](https://animate-ui.com/docs)
  - **Rule**: Prefer `animate-ui` for menus, buttons, and popovers to maintain the "premium" feel.
  - **Careful**: When using `Highlight` components, prefer `mode="parent"` for complex interactive lists.
- **`web/src/components/custom/`**: Higher-level, multi-part component systems (e.g., `DataTable`, `Sidebar`).
- **`web/src/components/`**: Feature-specific implementations (e.g., `LoginForm`, `NavUser`).

### Styling (Tailwind v4)
- **Variables**: Refer to `web/src/shadcn-theme.css` for base tokens and `web/src/index.css` for overrides.
- **Rules**: 
  - Use `primary`, `secondary`, `accent`, `muted`, etc., for colors.
  - Use `radius` for border-radius.
  - Use `sidebar-*` variables for anything inside the navigation drawer.

---

## 🛠️ Operational Commands (Makefile)
This project uses a `Makefile` for all standard operations.

- `make dev`: Start Backend (Air) and Frontend (Vite) in parallel.
- `make openapi-gen`: Regenerate TypeScript types from Go structs. **Critical**.
- `make test`: Run all tests (Go + Vitest).
- `make lint-backend`: Run `golangci-lint`.
- `make lint-frontend`: Run `eslint` (and other checks).
- `make build`: Build production binaries for both stacks.

---

## 🏗️ Architecture & Patterns

### ⚙️ Backend (Go)
- **Framework**: Huma (OpenAPI 3.1) + Chi (Router).
- **Database**: SQLite via GORM.
    - Models: `internal/database/models.go`
    - **Rule**: Ensure new models are added to `AutoMigrate` in `internal/database/db.go`.
- **Auth**: Middleware `internal/middleware/auth.go`.
    - `middleware.RequireAdmin(ctx)`: Protects admin-only routes.
    - `middleware.GetUser(ctx)`: Retrieves current user.

### 🎨 Frontend (React)
- **Framework**: Vite + React.
- **Routing**: TanStack Router (File-based).
    - `web/src/routes/_auth.tsx`: Layout for **all** authenticated routes.
    - `web/src/routes/_public.tsx`: Layout for public routes.
- **State**:
    - **Server State**: TanStack Query (`useQuery`, `useMutation`).
    - **Global State**: Minimal. Use URL search params or Context for granular things (like Auth).

---

## 🚀 Quick Workflows

### How to Add a New Page
1. Create file: `web/src/routes/_auth.my-page.tsx`
2. Implement component:
   ```tsx
   export const Route = createFileRoute('/_auth/my-page')({ component: MyPage })
   function MyPage() { return <div>Content</div> }
   ```
3. (Optional) generic layouts: Wrap content in `<DashboardLayout>`.

### How to Add a New API Endpoint
1. Create handler: `internal/api/handlers/my_handler.go`
2. Define `Input` and `Output` structs with Huma tags.
3. Register route:
   ```go
   func RegisterMyHandler(api huma.API) {
       huma.Get(api, "/api/resource", HandlerFunc)
   }
   ```
4. Wire up: Add `handlers.RegisterMyHandler(api)` to `internal/api/api.go`.
5. **Run `make openapi-gen`**.
