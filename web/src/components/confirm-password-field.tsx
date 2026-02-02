import { FieldApi } from '@tanstack/react-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { PasswordInput } from '@/components/password-input'

interface ConfirmPasswordFieldProps {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  field: FieldApi<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
  /* eslint-enable @typescript-eslint/no-explicit-any */
  valueToMatch: string
  label?: string
  placeholder?: string
}

export function ConfirmPasswordField({
  field,
  valueToMatch,
  label = 'Confirm Password',
  placeholder = 'Confirm password',
}: ConfirmPasswordFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const confirmPassword = field.state.value
  const showMatchStatus = confirmPassword.length > 0 && !isInvalid
  const passwordsMatch = valueToMatch === confirmPassword

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <PasswordInput
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
        autoComplete="new-password"
        required
      />
      <div className="min-h-5 py-0.5">
        {isInvalid ? (
          <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />
        ) : (
          showMatchStatus && (
            <p
              className={`text-xs font-medium ${passwordsMatch ? 'text-success' : 'text-destructive'
                }`}
            >
              {passwordsMatch
                ? '✓ Passwords match'
                : '✗ Passwords do not match'}
            </p>
          )
        )}
      </div>
    </Field>
  )
}
