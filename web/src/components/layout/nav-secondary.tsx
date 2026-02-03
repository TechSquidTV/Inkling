import * as React from 'react'
import { type Icon } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/custom/sidebar'

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isExternal =
              item.url.startsWith('http') || item.url.startsWith('#')
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  {isExternal ? (
                    <a
                      href={item.url}
                      target={
                        item.url.startsWith('http') ? '_blank' : undefined
                      }
                      rel={
                        item.url.startsWith('http') ? 'noreferrer' : undefined
                      }
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </a>
                  ) : (
                    <Link to={item.url}>
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
