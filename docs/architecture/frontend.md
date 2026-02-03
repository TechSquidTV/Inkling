# Frontend Architecture

## Overview
The Inkling frontend is a modern Single Page Application (SPA) built with **React 19**, **TypeScript**, and **Vite**. It is designed with a focus on type safety, performance, and developer experience.

## Tech Stack

### Core
- **Framework**: React 19
- **Language**: TypeScript (~5.9)
- **Build Tool**: Vite 7
- **Package Manager**: pnpm

### Routing & Data
- **Routing**: `@tanstack/react-router` (File-based routing)
- **API Client**: `openapi-fetch` (Type-safe fetch wrapper)
- **Forms**: `@tanstack/react-form` + `zod` validation

### UI & Styling
- **CSS Engine**: Tailwind CSS 4
- **Component Library**: `shadcn/ui` (built on Radix UI primitives)
- **Icons**: `lucide-react`, `@tabler/icons-react`
- **Animations**: `motion` (modern animation library), custom CSS
- **Theming**: `next-themes` (Dark/Light mode)

### Utilities
- **Logging**: `@logtape/logtape`
- **Date Handling**: Native `Date` or standard libraries as needed
- **Linting**: ESLint + Prettier

---

## Project Structure

The source code is located in `web/src`:

```
web/src/
├── assets/          # Static assets (images, fonts)
├── components/      # React components
│   ├── animate-ui/  # Custom high-fidelity animated components
│   ├── ui/          # Reusable foundational UI components (Shadcn)
│   ├── auth/        # Authentication related components
│   ├── common/      # Shared utilities and components
│   ├── features/    # Feature-specific components (logs, dashboard, settings)
│   ├── layout/      # Application shell and navigation
│   └── custom/      # Complex unique component systems
├── hooks/           # Custom React hooks
├── lib/             # Shared utilities
│   ├── api.ts       # API client configuration
│   ├── auth.tsx     # Authentication logic and context
│   └── logger.ts    # Logging configuration
├── routes/          # File-based routes (TanStack Router)
├── App.tsx          # Main App component & Router provider
└── main.tsx         # Entry point
```

---

## Key Concepts

### Routing Strategy
We utilize **TanStack Router** for a fully type-safe routing experience.
- **File-Based**: Routes are defined by the file structure in `src/routes`.
    - `__root.tsx`: The root layout wrapping the entire app.
    - `_auth.tsx`: Layout for authenticated routes (dashboard, settings).
- **Code Splitting**: Routes are automatically code-split by default.
- **Route Tree**: The `routeTree.gen.ts` file is auto-generated; do not edit it manually.

### API & Data Fetching
Data fetching is handled using **openapi-fetch**, which consumes TypeScript types generated directly from the backend OpenAPI specification.
- **Type Generation**: Run `pnpm openapi:generate` to update types in `src/lib/api-types.ts`.
- **Client Usage**: The typed client exports `GET`, `POST`, `PUT`, etc., ensuring payload and response types match the backend source of truth.
- **Integration**: The client is configured with a base URL and automatically attaches the `Authorization` header via middleware.

### Authentication
Authentication is managed via a React Context (`AuthProvider`).
- **Mechanism**: JWT-based authentication. The token is stored in `localStorage`.
- **Interceptors**: The API client intercepts 401 responses to trigger a "unauthorized" event, which the UI observes to redirect users to login.
- **Guards**: The `_auth` route layout acts as a guard, redirecting unauthenticated users to `/login`.

### Styling System
The project uses **Tailwind CSS v4** for styling, integrated via the Vite plugin.
- **Components**: We follow the `shadcn/ui` pattern where components are copy-pasted into `src/components/ui` and owned by the project.
- **Customization**: Design tokens (colors, radius) are defined in CSS variables in `src/index.css`.
- **Animation**: Complex animations use the `motion` library for performant, declarative transitions. Mostly using `animate-ui` components.

---

## Development Workflow

### Setup
1. Install dependencies: `pnpm install`
2. Start development server: `pnpm dev`

### Code Generation
- **Routes**: When you add files to `src/routes`, the watcher usually updates `routeTree.gen.ts`. If not, run `pnpm tsr:generate`.
- **API Types**: If the backend API changes, regenerate the frontend types:
  ```bash
  pnpm openapi:generate
  ```

### Linting & Formatting
- **Lint**: `pnpm lint`
- **Format**: `pnpm format`
