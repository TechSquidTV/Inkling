import { useCallback, useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AppLogo } from '@/components/app-logo'
import {
  IconDashboard,
  IconHelp,
  IconSettings,
  IconTerminal,
} from '@tabler/icons-react'

import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/custom/sidebar'
import { APP_CONFIG } from '@/constants'
import { useAuth } from '@/lib/auth'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Logs',
      url: '/logs',
      icon: IconTerminal,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: IconSettings,
    },
    {
      title: 'Documentation',
      url: APP_CONFIG.LINKS.GITHUB,
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Handle logout with navigation
  const handleLogout = useCallback(() => {
    logout()
    navigate({ to: '/' })
  }, [logout, navigate])

  // Build user data for NavUser from auth context
  const userData = {
    name: user?.name || 'User',
    email: user?.email || '',
    avatar: '', // No avatar URL, will use initials fallback
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard">
                <AppLogo className="size-5!" />
                <span className="text-base font-semibold">
                  {APP_CONFIG.NAME}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="gap-0">
        <NavUser user={userData} onLogout={handleLogout} />
        <div className="border-sidebar-border bg-sidebar-footer/50 mt-2 border-t px-4 py-2 opacity-50">
          <VersionIndicator />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function VersionIndicator() {
  const [version, setVersion] = useState<{
    version: string
    commit: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => setVersion(data))
      .catch(() => {})
  }, [])

  if (!version) return null

  return (
    <small
      aria-label="App version info"
      className="flex items-center justify-between text-[10px] font-medium tracking-wider uppercase"
    >
      <span>{version.version}</span>
      <span className="font-mono">{version.commit}</span>
    </small>
  )
}
