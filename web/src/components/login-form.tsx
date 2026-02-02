import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AuthBrandImage } from '@/components/auth-brand-image'
import { APP_CONFIG } from '@/constants'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { client } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/' })
  const auth = useAuth()
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { data, error } = await client.POST('/auth/login', {
          body: value,
        })

        if (error) {
          throw new Error(error.detail || 'Login failed')
        }

        if (data?.token) {
          auth.login(data.token)
          toast.success('Welcome back!')
          // Navigate to redirect URL if present, otherwise dashboard
          const redirectTo = search.redirect || '/dashboard'
          navigate({ to: redirectTo })
        }
      } catch (error) {
        console.error('Login error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong'
        )
      }
    },
  })

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{APP_CONFIG.NAME}</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your {APP_CONFIG.NAME} account
                </p>
              </div>

              <form.Field
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
                        aria-describedby={
                          isInvalid ? `${field.name}-error` : undefined
                        }
                        autoComplete="username"
                        required
                      />
                      {isInvalid && (
                        <FieldError
                          id={`${field.name}-error`}
                          errors={field.state.meta.errors}
                        />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        aria-describedby={
                          isInvalid ? `${field.name}-error` : undefined
                        }
                        autoComplete="current-password"
                        required
                      />
                      {isInvalid && (
                        <FieldError
                          id={`${field.name}-error`}
                          errors={field.state.meta.errors}
                        />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Subscribe
                selector={(state) => [state.isSubmitting]}
                children={([isSubmitting]) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>
                )}
              />

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    window.location.href = '/api/auth/login'
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Login with OIDC
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <AuthBrandImage />
        </CardContent>
      </Card>
    </div>
  )
}
