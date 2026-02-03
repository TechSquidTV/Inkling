import { toast } from 'sonner'
import { User, Key } from 'lucide-react'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { useAuth } from '@/lib/auth'
import { client } from '@/lib/api'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { ConfirmPasswordField } from '@/components/auth/confirm-password-field'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function ProfileSettings() {
  const auth = useAuth()

  const profileForm = useForm({
    defaultValues: {
      name: auth.user?.name || '',
      email: auth.user?.email || '',
    },
    validators: {
      onChange: profileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await client.PUT('/me', {
          body: value,
        })

        if (error) {
          throw new Error(error.detail || 'Failed to update profile')
        }

        toast.success('Profile updated')
        auth.refreshUser()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update profile'
        )
      }
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onChange: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await client.PUT('/me/password', {
          body: {
            current_password: value.currentPassword,
            new_password: value.newPassword,
          },
        })

        if (error) {
          throw new Error(error.detail || 'Failed to change password')
        }

        toast.success('Password changed successfully')
        passwordForm.reset()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to change password'
        )
      }
    },
  })

  // Check if user has a password set (false for OIDC-only users)
  const hasPassword = auth.user?.hasPassword ?? false

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              profileForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <profileForm.Field
                  name="name"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Your name"
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <profileForm.Field
                  name="email"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="you@example.com"
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              </div>
              <div className="flex justify-end">
                <profileForm.Subscribe
                  selector={(state) => [state.isSubmitting]}
                  children={([isSubmitting]) => (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                />
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password. You'll need to enter your current password to
            confirm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPassword ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                passwordForm.handleSubmit()
              }}
            >
              <FieldGroup>
                <passwordForm.Field
                  name="currentPassword"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Current Password
                        </FieldLabel>
                        <PasswordInput
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter current password"
                          aria-invalid={isInvalid}
                        />
                        <div className="min-h-5 py-0.5">
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    )
                  }}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <passwordForm.Field
                    name="newPassword"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            New Password
                          </FieldLabel>
                          <PasswordInput
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter new password"
                            aria-invalid={isInvalid}
                          />
                          <PasswordStrengthIndicator
                            password={field.state.value}
                          />
                          <div className="min-h-5 py-0.5">
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </div>
                        </Field>
                      )
                    }}
                  />

                  <passwordForm.Subscribe
                    selector={(state) => state.values.newPassword}
                    children={(newPassword) => (
                      <passwordForm.Field
                        name="confirmPassword"
                        children={(field) => (
                          <ConfirmPasswordField
                            field={field}
                            valueToMatch={newPassword}
                          />
                        )}
                      />
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <passwordForm.Subscribe
                    selector={(state) => [state.isSubmitting]}
                    children={([isSubmitting]) => (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Changing...' : 'Change Password'}
                      </Button>
                    )}
                  />
                </div>
              </FieldGroup>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              Password change is not available for accounts using single sign-on
              (SSO).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
