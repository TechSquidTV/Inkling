import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const router = createRouter({
  routeTree,
  defaultViewTransition: {
    types: () => ['fade'],
  },
  context: {
    // auth is provided at runtime in App.tsx via the RouterProvider.
    // We use undefined! here to satisfy the type requirement for the router instance
    // while keeping the type strict (non-nullable) for consumers.
    auth: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
