import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ChevronDown, Globe, Menu, X } from 'lucide-react'
import { BRAND_NAME, LAUNCH_MARKET } from '../../lib/serviceArea'

const NAV = [
  { label: 'Book', to: '/book' },
  { label: 'Earn', to: '/mover/login' },
  { label: 'Business', to: '/book' },
  { label: 'About', to: '#how-it-works' },
]

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-ink text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/" className="shrink-0 font-bold text-lg tracking-tight">
            {BRAND_NAME}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <button type="button" className="flex items-center gap-1 px-3 py-2 text-sm text-white/80 hover:text-white rounded-lg">
            <Globe size={16} />
            EN
          </button>
          <Link to="/login" className="px-3 py-2 text-sm text-white/90 hover:text-white rounded-lg">
            Log in
          </Link>
          <Link
            to="/register"
            className="ml-1 px-4 py-2 text-sm font-semibold bg-white text-ink rounded-full hover:bg-gray-100 transition"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-white/10"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="px-3 py-2.5 text-sm rounded-lg hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/login" className="px-3 py-2.5 text-sm rounded-lg hover:bg-white/10" onClick={() => setMenuOpen(false)}>
            Log in
          </Link>
          <Link
            to="/register"
            className="mx-3 mt-2 py-2.5 text-sm font-semibold bg-white text-ink rounded-full text-center"
            onClick={() => setMenuOpen(false)}
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  )
}

export function LocationChip() {
  return (
    <div className="flex items-center gap-1.5 text-sm text-ink-muted mb-4">
      <MapPin size={15} className="text-accent shrink-0" />
      <span>
        {LAUNCH_MARKET.primary}, {LAUNCH_MARKET.province}
      </span>
      <span className="text-ink-muted/60">·</span>
      <a href="#service-area" className="text-ink underline underline-offset-2 hover:text-accent">
        Service area
      </a>
    </div>
  )
}

export function ScheduleChip() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm font-medium bg-surface-muted border border-gray-200 rounded-lg px-3 py-2 mb-5 hover:border-gray-300 transition"
    >
      <span className="w-2 h-2 rounded-full bg-accent" />
      Book now
      <ChevronDown size={16} className="text-ink-muted" />
    </button>
  )
}
