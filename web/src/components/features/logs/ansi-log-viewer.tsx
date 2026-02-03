import { useMemo, useRef, useEffect, useState } from 'react'
import { AnsiUp } from 'ansi_up'
import { cn } from '@/lib/utils'

interface AnsiLogViewerProps {
  logs: string
  className?: string
}

const ansiUp = new AnsiUp()
// Enable use of CSS classes for colors instead of inline styles
ansiUp.use_classes = false
// Escape HTML to prevent XSS
ansiUp.escape_html = true

export function AnsiLogViewer({ logs, className }: AnsiLogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const html = useMemo(() => {
    return ansiUp.ansi_to_html(logs)
  }, [logs])

  // Handle scroll events to detect if user is at bottom
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    // Use a small buffer (5px) for the bottom check
    const atBottom = scrollHeight - scrollTop - clientHeight < 5
    setIsAtBottom(atBottom)
  }

  // Auto-scroll to bottom when logs change, if we were already at bottom
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, isAtBottom])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        'max-h-[600px] overflow-y-auto scroll-smooth rounded-md border bg-black p-4 font-mono text-sm text-gray-300',
        className
      )}
    >
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="break-all whitespace-pre-wrap"
      />
    </div>
  )
}
