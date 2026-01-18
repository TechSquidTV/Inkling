import createClient from 'openapi-fetch'
import type { paths } from './api-types'
import { logMilestone, LogKeys } from './logger'

export class APIError extends Error {
  public status: number
  public data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

import { APP_CONFIG } from '@/constants'

const client = createClient<paths>({
  baseUrl: APP_CONFIG.API_BASE_URL,
})

// Middleware to add auth token
export const authMiddleware = {
  async onRequest({ request }: { request: Request }) {
    const token = localStorage.getItem('token')
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
  async onResponse({
    response,
    request,
  }: {
    response: Response
    request: Request
  }) {
    const url = new URL(request.url)

    logMilestone('api request completed', {
      [LogKeys.METHOD]: request.method,
      [LogKeys.PATH]: url.pathname,
      [LogKeys.STATUS]: response.status,
    })

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return response
  },
}

client.use(authMiddleware)

export { client }

/**
 * Legacy fetchWithAuth for backward compatibility if needed,
 * but prefer using the typed 'client' directly.
 */
export async function fetchWithAuth<T = unknown>(
  url: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options

  const authHeaders: HeadersInit = {}
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...authHeaders,
      ...headers,
    },
  })

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new APIError('Unauthorized', 401)
  }

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: response.statusText }
    }
    throw new APIError(
      errorData.message || 'An error occurred',
      response.status,
      errorData
    )
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
