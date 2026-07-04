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
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50 disabled:pointer-events-none'

    const variants = {
      primary: 'bg-accent text-white shadow-sm hover:bg-accent-hover active:scale-[0.98]',
      secondary: 'bg-white text-ink border border-gray-200 hover:bg-gray-50',
      deal: 'bg-amber-400 text-ink hover:bg-amber-300',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'text-ink-muted hover:bg-gray-100',
    }

    const sizes = {
      sm: 'text-sm px-3.5 py-2 min-h-[40px]',
      md: 'text-[15px] px-4 py-3 min-h-[48px]',
      lg: 'text-base px-5 py-3.5 min-h-[52px]',
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
