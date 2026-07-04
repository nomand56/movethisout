import { Link } from 'react-router-dom'
import { clsx } from '../../lib/clsx'

interface Props {
  variant?: 'default' | 'billboard' | 'compact'
  className?: string
  linkTo?: string
}

export default function Wordmark({ variant = 'default', className, linkTo }: Props) {
  const content = (
    <span
      className={clsx(
        'font-display uppercase leading-none',
        variant === 'billboard' && 'text-white text-[clamp(2rem,8vw,3.5rem)] [text-shadow:3px_3px_0_#141414]',
        variant === 'compact' && 'text-jet text-xl',
        variant === 'default' && 'text-jet text-2xl',
        className,
      )}
    >
      MoveThis<span className="text-haul">Out</span>
      <span className="text-haul"> ▸</span>
    </span>
  )

  if (linkTo) return <Link to={linkTo}>{content}</Link>
  return content
}
