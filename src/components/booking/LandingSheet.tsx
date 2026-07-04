import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/** Marketing / landing bottom sheet (not fixed — sits in page flow). */
export default function LandingSheet({ children, className = '' }: Props) {
  return (
    <div className={`relative z-20 w-full max-w-lg mx-auto ${className}`}>
      <div className="bg-white rounded-t-3xl shadow-sheet border-t border-gray-100 px-5 pt-3 pb-8">
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  )
}
