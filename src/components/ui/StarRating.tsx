import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}

export default function StarRating({ value, onChange, readonly }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={24}
            className={star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
