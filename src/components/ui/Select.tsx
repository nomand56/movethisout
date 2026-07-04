import { SelectHTMLAttributes, forwardRef } from 'react'
import { clsx } from '../../lib/clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-condensed font-bold uppercase tracking-wider text-jet">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full border-3 px-4 py-3 text-base bg-white text-jet focus:outline-none focus:ring-2 focus:ring-haul min-h-[48px]',
            error ? 'border-red-600' : 'border-jet',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
export default Select
