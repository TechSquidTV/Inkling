import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIError } from './api'

describe('APIError', () => {
  it('creates an error with status and message', () => {
    const error = new APIError('Not found', 404)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.name).toBe('APIError')
  })

  it('creates an error with additional data', () => {
    const errorData = { field: 'email', reason: 'invalid' }
    const error = new APIError('Validation failed', 400, errorData)

    expect(error.status).toBe(400)
    expect(error.data).toEqual(errorData)
  })

  it('handles 401 unauthorized errors', () => {
    const error = new APIError('Unauthorized', 401)

    expect(error.status).toBe(401)
    expect(error.message).toBe('Unauthorized')
  })

  it('handles 500 server errors', () => {
    const error = new APIError('Internal server error', 500)

    expect(error.status).toBe(500)
  })
})

describe('fetchWithAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches auth:unauthorized event on 401', async () => {
    const { fetchWithAuth } = await import('./api')

    // Mock fetch to return 401
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    })

    const eventListener = vi.fn()
    window.addEventListener('auth:unauthorized', eventListener)

    await expect(fetchWithAuth('/api/test')).rejects.toThrow(APIError)
    expect(eventListener).toHaveBeenCalled()

    window.removeEventListener('auth:unauthorized', eventListener)
  })

  it('adds authorization header when token is provided', async () => {
    const { fetchWithAuth } = await import('./api')

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: true }),
    })

    await fetchWithAuth('/api/test', { token: 'test-token' })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
  })

  it('throws APIError on non-ok responses', async () => {
    const { fetchWithAuth } = await import('./api')

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 400,
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid input' }),
    })

    await expect(fetchWithAuth('/api/test')).rejects.toThrow(APIError)
    await expect(fetchWithAuth('/api/test')).rejects.toThrow('Invalid input')
  })

  it('returns empty object for 204 responses', async () => {
    const { fetchWithAuth } = await import('./api')

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: async () => {
        throw new Error('Should not be called')
      },
    })

    const result = await fetchWithAuth('/api/test')
    expect(result).toEqual({})
  })

  it('parses JSON response on success', async () => {
    const { fetchWithAuth } = await import('./api')

    const mockData = { id: 1, name: 'Test' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockData,
    })

    const result = await fetchWithAuth('/api/test')
    expect(result).toEqual(mockData)
  })

  it('handles errors when response is not JSON', async () => {
    const { fetchWithAuth } = await import('./api')

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Not JSON')
      },
    })

    await expect(fetchWithAuth('/api/test')).rejects.toThrow(APIError)
  })
})
