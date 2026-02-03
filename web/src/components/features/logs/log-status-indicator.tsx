import { cn } from '@/lib/utils'
import type { StatusDotProps } from '@/components/common/status-dot'
import { StatusDot } from '@/components/common/status-dot'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

interface LogStatusIndicatorProps {
  status: ConnectionStatus
}

export function LogStatusIndicator({ status }: LogStatusIndicatorProps) {
  const statusConfig: Record<
    ConnectionStatus,
    { label: string; variant: StatusDotProps['variant']; textClass: string }
  > = {
    connected: {
      label: 'Connected',
      variant: 'success',
      textClass: 'text-success',
    },
    connecting: {
      label: 'Connecting...',
      variant: 'warning',
      textClass: 'text-warning',
    },
    disconnected: {
      label: 'Disconnected',
      variant: 'destructive',
      textClass: 'text-destructive',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn('flex items-center gap-2.5 text-sm/none', config.textClass)}
    >
      <StatusDot variant={config.variant} size="sm" className="shrink-0" />
      <span className="leading-none">{config.label}</span>
    </div>
  )
}
