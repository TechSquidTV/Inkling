import { cn } from '@/lib/utils'

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'primary'

export interface StatusDotProps {
  variant?: StatusVariant
  className?: string
  ping?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusDot({
  variant = 'success',
  className,
  ping = true,
  size = 'sm',
}: StatusDotProps) {
  const variantClasses = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    info: 'bg-info',
    primary: 'bg-primary',
  }

  const sizeClasses = {
    sm: 'h-2 w-2 min-h-2 min-w-2',
    md: 'h-3 w-3 min-h-3 min-w-3',
    lg: 'h-4 w-4 min-h-4 min-w-4',
  }

  const dotClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClass,
        className
      )}
    >
      {ping && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            dotClass
          )}
        ></span>
      )}
      <span
        className={cn('relative inline-flex rounded-full', sizeClass, dotClass)}
      ></span>
    </div>
  )
}
