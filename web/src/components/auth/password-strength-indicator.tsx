import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface StrengthResult {
  score: number
  label: string
  barColor: string
  textColor: string
}

function calculateStrength(password: string): StrengthResult {
  let score = 0

  if (password.length === 0) {
    return { score: 0, label: '', barColor: '', textColor: '' }
  }

  // Length checks
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Normalize to 0-4 scale
  const normalizedScore = Math.min(4, Math.floor(score / 2))

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  // Use theme colors: destructive for weak, warning for medium, success for strong
  const barColors = [
    'bg-destructive',
    'bg-destructive/70',
    'bg-warning',
    'bg-success/70',
    'bg-success',
  ]
  const textColors = [
    'text-destructive',
    'text-destructive',
    'text-warning',
    'text-success',
    'text-success',
  ]

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    barColor: barColors[normalizedScore],
    textColor: textColors[normalizedScore],
  }
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password])

  return (
    <div
      className={cn('min-h-10 space-y-1 py-1', className)}
      style={{ visibility: password ? 'visible' : 'hidden' }}
    >
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              index <= strength.score ? strength.barColor : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', strength.textColor)}>
        {strength.label || 'Placeholder'}
      </p>
    </div>
  )
}
