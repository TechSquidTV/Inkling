import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth, APIError } from '@/lib/api'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/animate-ui/components/base/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { UsersTable } from './users-table'

interface AdminSettings {
  registration_enabled: boolean
}

export function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const auth = useAuth()

  const fetchSettings = useCallback(async () => {
    try {
      const data = await fetchWithAuth<AdminSettings>('/api/admin/settings', {
        token: auth.token,
      })
      setSettings(data)
    } catch {
      toast.error('Failed to load admin settings')
    } finally {
      setIsLoading(false)
    }
  }, [auth.token])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function updateRegistration(enabled: boolean) {
    setIsUpdating(true)
    try {
      const data = await fetchWithAuth<AdminSettings>('/api/admin/settings', {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({ registration_enabled: enabled }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      setSettings(data)
      toast.success(enabled ? 'Registration enabled' : 'Registration disabled')
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update settings')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-4 text-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Settings
          </CardTitle>
          <CardDescription>
            Configure application-wide settings. Only administrators can access
            this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="registration-toggle"
                className="flex items-center gap-2 text-base font-medium"
              >
                <Users className="h-4 w-4" />
                User Registration
              </Label>
              <p className="text-muted-foreground text-sm">
                When disabled, new users cannot sign up. Existing users can
                still log in.
              </p>
            </div>
            <Switch
              id="registration-toggle"
              checked={settings?.registration_enabled ?? true}
              onCheckedChange={updateRegistration}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>
      <Separator />
      <UsersTable />
    </div>
  )
}
