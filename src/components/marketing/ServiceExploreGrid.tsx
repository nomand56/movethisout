import { Link } from 'react-router-dom'
import {
  Truck,
  Package,
  Building2,
  Calendar,
  Briefcase,
  Wallet,
} from 'lucide-react'
import { PROMO_LAUNCH } from '../../lib/serviceArea'

const SERVICES = [
  {
    icon: Truck,
    title: 'Local move',
    desc: 'Apartment, house, or room — movers with trucks near you.',
    to: '/book',
    cta: 'Book',
  },
  {
    icon: Package,
    title: 'Same-day delivery',
    desc: 'Furniture, appliances, or bulky items moved today.',
    to: '/book',
    cta: 'Book',
  },
  {
    icon: Building2,
    title: 'Apartment moves',
    desc: 'Stairs, elevators, parking — we handle the details.',
    to: '/book',
    cta: 'Details',
  },
  {
    icon: Calendar,
    title: 'Schedule ahead',
    desc: 'Pick your date and time window. Price locked upfront.',
    to: '/book',
    cta: 'Reserve',
  },
  {
    icon: Briefcase,
    title: 'Business moves',
    desc: 'Office equipment and retail inventory anywhere in Canada.',
    to: '/book',
    cta: 'Details',
  },
  {
    icon: Wallet,
    title: 'Drive & earn',
    desc: 'Own a truck? Claim jobs on your schedule across Canada.',
    to: '/mover/login',
    cta: 'Apply',
  },
]

export default function ServiceExploreGrid() {
  return (
    <section id="how-it-works" className="bg-white border-t border-gray-100 py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-8">
          Explore what you can do with MoveThisOut
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map(({ icon: Icon, title, desc, to, cta }) => (
            <div
              key={title}
              className="group flex gap-4 items-start bg-surface-muted hover:bg-gray-100/80 rounded-2xl p-5 transition"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink text-lg mb-1">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed mb-4">{desc}</p>
                <Link
                  to={to}
                  className="inline-flex items-center px-4 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-full hover:border-gray-300 transition"
                >
                  {cta}
                </Link>
              </div>
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center">
                <Icon size={28} className="text-accent" strokeWidth={1.5} />
              </div>
            </div>
          ))}
        </div>

        <div id="service-area" className="mt-12 rounded-2xl bg-accent-soft border border-accent/15 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">Launch offer</p>
            <p className="text-xl font-bold text-ink">20% off your first move</p>
            <p className="text-sm text-ink-muted mt-1">
              Use code <span className="font-mono font-bold text-ink">{PROMO_LAUNCH}</span> when you book.
            </p>
          </div>
          <Link
            to="/book"
            className="shrink-0 inline-flex justify-center px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-hover transition"
          >
            Book now
          </Link>
        </div>
      </div>
    </section>
  )
}

export function AccountCtaSection() {
  return (
    <section className="bg-surface-muted py-14 sm:py-16 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
            Log in to see your account details
          </h2>
          <p className="text-ink-muted leading-relaxed">
            View past moves, track active deliveries, saved addresses, and referral credits — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/login"
              className="px-6 py-3 bg-ink text-white font-semibold rounded-full hover:bg-ink/90 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-white border border-gray-200 font-semibold rounded-full hover:border-gray-300 transition"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex items-end justify-center gap-2">
          {['#E85D04', '#1E293B', '#F5F5F7', '#FFC400', '#1A1A1A'].map((color, i) => (
            <div
              key={color}
              className="rounded-2xl shadow-soft"
              style={{
                background: color,
                width: 72 - i * 4,
                height: 120 + i * 12,
                opacity: 0.9 - i * 0.08,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center sm:text-left flex flex-col sm:flex-row sm:justify-between gap-6">
        <div>
          <p className="font-bold text-ink">MoveThisOut</p>
          <p className="text-sm text-ink-muted mt-1">Moves across Canada — upfront price</p>
          <p className="text-xs text-ink-muted mt-3">© {new Date().getFullYear()} MoveThisOut</p>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2 text-sm text-ink-muted">
          <Link to="/book" className="hover:text-ink">Book a move</Link>
          <Link to="/mover/login" className="hover:text-ink">Drive with us</Link>
          <Link to="/login" className="hover:text-ink">Customer login</Link>
          <Link to="/admin/login" className="hover:text-ink">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
