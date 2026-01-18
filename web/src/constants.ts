export const APP_CONFIG = {
  NAME: 'Inkling',
  BASE_URL: 'http://localhost:8080',
  API_BASE_URL:
    typeof window !== 'undefined'
      ? new URL('/api', window.location.origin).toString()
      : 'http://localhost/api',
  /**
   * Logo configuration
   * Used in: app-logo.tsx, login-form.tsx, signup-form.tsx
   */
  LOGO: {
    PATH: '/app-logo.png',
    ALT: 'Inkling Logo',
  },
  /**
   * External links and legal URLs
   * Used in: site-header.tsx, app-sidebar.tsx, login-form.tsx, signup-form.tsx
   */
  LINKS: {
    GITHUB: 'https://github.com/TechSquidTV/inkling',
  },
  /**
   * Logging configuration
   * Used in: logger.ts
   */
  LOGGER_NAME: 'inkling',
}
