import { ApiKeys } from '@/components/features/settings/api-keys'
import { AdminSettings } from '@/components/features/settings/admin-settings'
import { ProfileSettings } from '@/components/features/settings/profile-settings'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createFileRoute } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_auth/settings')({
  component: Settings,
})

function Settings() {
  const { isAdmin } = useAuth()

  return (
    <DashboardLayout
      title="Settings"
      description="Manage your account settings and API keys."
    >
      <div className="space-y-6 px-4 lg:px-6">
        <ProfileSettings />
        <Separator />
        <ApiKeys />
        {isAdmin && (
          <>
            <Separator />
            <AdminSettings />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
