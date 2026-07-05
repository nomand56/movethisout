import { Link } from 'react-router-dom'
import { MapPin, DollarSign, Truck, Shield } from 'lucide-react'
import { SERVICE_AREA_LABEL, PROMO_LAUNCH, LAUNCH_MARKET, FEATURED_CITIES } from '../../lib/serviceArea'
import Button from '../ui/Button'

export default function MarketingSections() {
  return (
    <div className="bg-white border-t border-gray-100">
      <section className="max-w-lg mx-auto px-5 py-10">
        <h2 className="text-xl font-bold text-ink mb-6">How it works</h2>
        <div className="flex flex-col gap-5">
          {[
            { icon: MapPin, title: 'Set your route', desc: 'Pin pickup and drop-off anywhere in Canada.' },
            { icon: DollarSign, title: 'See your price', desc: 'Guaranteed upfront quote before you book. No surprises.' },
            { icon: Truck, title: 'A local mover claims it', desc: 'Vetted drivers with trucks & muscle near you.' },
            { icon: Shield, title: 'Track live', desc: 'Follow your move on the map until it\'s done.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <Icon size={20} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="text-sm text-ink-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-10">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-ink mb-2">Serving all of {SERVICE_AREA_LABEL}</h2>
          <p className="text-sm text-ink-muted mb-4">
            Book moves in cities and towns across Canada — from {LAUNCH_MARKET.hq} to coast to coast.
            Apartment moves, furniture delivery, same-day help.
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURED_CITIES.map((city) => (
              <span key={city} className="text-xs font-medium bg-white border border-gray-200 rounded-full px-3 py-1.5 text-ink">
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-lg mx-auto px-5 py-10">
        <div className="card p-5 bg-accent-soft border-accent/20">
          <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">Launch offer</p>
          <p className="text-lg font-bold text-ink mb-1">$20 off your first move</p>
          <p className="text-sm text-ink-muted mb-3">Use code <span className="font-mono font-bold text-ink">{PROMO_LAUNCH}</span> at checkout.</p>
          <Link to="/book"><Button size="sm">Book now</Button></Link>
        </div>
      </section>

      <section className="max-w-lg mx-auto px-5 py-8 border-t border-gray-100">
        <h2 className="text-lg font-bold text-ink mb-4">For movers &amp; drivers</h2>
        <p className="text-sm text-ink-muted mb-4">
          Own a truck in Canada? Get paid per job on your schedule.
        </p>
        <Link to="/mover/login" className="text-accent font-semibold text-sm hover:underline">
          Join as a mover →
        </Link>
      </section>

      <footer className="max-w-lg mx-auto px-5 py-8 text-center text-xs text-ink-muted border-t border-gray-100">
        <p className="font-semibold text-ink mb-1">MoveThisOut · Canada</p>
        <p>© {new Date().getFullYear()} MoveThisOut. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link to="/login" className="hover:text-ink">Customer login</Link>
          <Link to="/mover/login" className="hover:text-ink">Mover login</Link>
          <Link to="/admin/login" className="hover:text-ink">Admin</Link>
        </div>
      </footer>
    </div>
  )
}
