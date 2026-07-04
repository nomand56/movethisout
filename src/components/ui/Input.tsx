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
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-condensed font-bold uppercase tracking-wider text-jet">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full border-3 px-4 py-3 text-base bg-white text-jet placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-haul min-h-[48px]',
            error ? 'border-red-600' : 'border-jet',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
export default Input
