import { useEffect, useState } from 'react'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export function useLogStream(service: string) {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)

  // Reset state when service changes
  const [prevService, setPrevService] = useState(service)
  if (service !== prevService) {
    setPrevService(service)
    setLogs([])
    setStatus('connecting')
    setError(null)
  }

  useEffect(() => {
    const eventSource = new EventSource(`/api/logs/stream?service=${service}`)
    // ... (rest of the effect)

    eventSource.onopen = () => {
      setStatus('connected')
      setError(null)
    }

    eventSource.onmessage = (event) => {
      setLogs((prev) => {
        const next = [...prev, event.data]
        if (next.length > 1000) {
          return next.slice(next.length - 1000)
        }
        return next
      })
    }

    eventSource.onerror = () => {
      setStatus('disconnected')
      setError('Connection lost. Please refresh the page.')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [service])

  return { logs: logs.join('\n'), status, error }
}
