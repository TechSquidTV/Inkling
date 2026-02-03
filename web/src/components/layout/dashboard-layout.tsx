import type React from 'react'
import { Separator } from '@/components/ui/separator'

interface DashboardLayoutProps {
  /** Page title displayed in the header */
  title: string
  /** Optional description displayed below the title */
  description?: string
  /** Page content */
  children: React.ReactNode
}

/**
 * Shared layout component for authenticated pages.
 * Provides consistent spacing, header styling, and full-width content area.
 *
 * @example
 * ```tsx
 * <DashboardLayout title="Settings" description="Manage your account">
 *   <SettingsForm />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  title,
  description,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="space-y-0.5 px-4 lg:px-6">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="px-4 lg:px-6">
            <Separator />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
