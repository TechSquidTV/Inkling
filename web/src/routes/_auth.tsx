import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/custom/sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type { CSSProperties } from 'react'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div style={{ viewTransitionName: 'main-content' }}>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
