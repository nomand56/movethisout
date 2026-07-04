import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from '../../lib/clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-xl border px-4 py-3 text-[15px] bg-white text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent min-h-[48px]',
            error ? 'border-red-400' : 'border-gray-200',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
export default Input
