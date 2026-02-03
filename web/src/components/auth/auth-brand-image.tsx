import { APP_CONFIG } from '@/constants'

/**
 * Shared branded image panel for auth forms (login/signup).
 */
export function AuthBrandImage() {
  return (
    <div className="bg-muted relative hidden md:block">
      <img
        src={APP_CONFIG.LOGO.PATH}
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:opacity-15 dark:grayscale"
      />
    </div>
  )
}
