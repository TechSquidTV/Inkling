import { configure, getConsoleSink } from '@logtape/logtape'
import { getSentrySink } from '@logtape/sentry'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { App } from './App'
import { router } from './router'
import { logger } from './lib/logger'
import { APP_CONFIG } from './constants'
import './index.css'

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.spotlightBrowserIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    'localhost',
    /^\//,
    /^https:\/\/yourserver\.io\/api/,
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Enable modern logs API
  enableLogs: true,
})

// Initialize LogTape
await configure({
  sinks: {
    console: getConsoleSink(),
    sentry: getSentrySink({
      enableBreadcrumbs: true,
    }),
  },
  loggers: [
    // Suppress meta logger info messages (only show warnings+)
    {
      category: ['logtape', 'meta'],
      lowestLevel: 'warning',
      sinks: ['console'],
    },
    {
      category: [], // Global logger
      lowestLevel: 'debug',
      sinks: ['console', 'sentry'],
    },
    {
      category: APP_CONFIG.LOGGER_NAME,
      lowestLevel: 'debug',
      sinks: ['console', 'sentry'],
    },
  ],
})

logger.info('Application starting up...')

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
  )
}
