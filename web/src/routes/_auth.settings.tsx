import { ApiKeys } from '@/components/settings/api-keys'
import { AdminSettings } from '@/components/settings/admin-settings'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { DashboardLayout } from '@/components/dashboard-layout'
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
