import { useNavigate } from '@tanstack/react-router'
import { IconDotsVertical, IconLogout, IconSettings } from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
} from '@/components/custom/drop-drawer'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/custom/sidebar'

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
  }
  onLogout?: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function NavUser({ user, onLogout }: NavUserProps) {
  const navigate = useNavigate()
  const initials = getInitials(user.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical aria-hidden="true" className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropDrawerTrigger>
          <DropDrawerContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
            <DropDrawerLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropDrawerLabel>
            <DropDrawerSeparator />
            <DropDrawerGroup>
              <DropDrawerItem onSelect={() => navigate({ to: '/settings' })}>
                <IconSettings aria-hidden="true" />
                Settings
              </DropDrawerItem>
            </DropDrawerGroup>
            <DropDrawerSeparator />
            <DropDrawerItem onSelect={onLogout}>
              <IconLogout aria-hidden="true" />
              Log out
            </DropDrawerItem>
          </DropDrawerContent>
        </DropDrawer>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
