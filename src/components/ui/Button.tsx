import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from '../../lib/clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'deal'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-sans font-extrabold uppercase tracking-wide border-3 border-jet transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-haul disabled:opacity-50 disabled:pointer-events-none'

    const variants = {
      primary: 'bg-haul text-white shadow-hard hover:bg-haul-hot active:translate-x-px active:translate-y-px active:shadow-none',
      secondary: 'bg-white text-jet hover:bg-concrete',
      deal: 'bg-caution text-jet shadow-hard hover:brightness-105',
      danger: 'bg-red-600 text-white border-red-800',
      ghost: 'border-transparent text-jet hover:bg-concrete shadow-none',
    }

    const sizes = {
      sm: 'text-sm px-3 py-2 min-h-[40px]',
      md: 'text-base px-4 py-3 min-h-[48px]',
      lg: 'text-lg px-6 py-4 min-h-[56px]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
export default Button
