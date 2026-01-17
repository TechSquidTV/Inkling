import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

interface MyRouterContext {
  auth: {
    isAuthenticated: boolean
    token: string | null
    login: (token: string) => void
    logout: () => void
  }
}

const RootLayout = () => (
  <>
    <Outlet />
  </>
)

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
})
