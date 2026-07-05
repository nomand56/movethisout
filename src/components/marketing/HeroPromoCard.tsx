import { Link } from 'react-router-dom'
import { ArrowRight, Home, MapPin, Package, Truck } from 'lucide-react'

const FLOATERS = [
  { Icon: Package, label: 'Items', className: 'hero-icon hero-icon--box', size: 22 },
  { Icon: MapPin, label: 'Pickup', className: 'hero-icon hero-icon--pickup', size: 20 },
  { Icon: Home, label: 'Drop-off', className: 'hero-icon hero-icon--home', size: 20 },
  { Icon: Truck, label: 'Mover', className: 'hero-icon hero-icon--truck', size: 26 },
] as const

export default function HeroPromoCard() {
  return (
    <div className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
      <div className="hero-promo-card group">
        {/* Animated gradient mesh */}
        <div className="hero-promo-gradient" aria-hidden />
        <div className="hero-promo-gradient-overlay" aria-hidden />

        {/* Glowing orbs */}
        <div className="hero-promo-orb hero-promo-orb--1" aria-hidden />
        <div className="hero-promo-orb hero-promo-orb--2" aria-hidden />
        <div className="hero-promo-orb hero-promo-orb--3" aria-hidden />

        {/* Animated route line */}
        <svg
          className="hero-promo-route"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
        >
          <path
            d="M40 50 C 80 90, 120 70, 160 110"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="hero-promo-route-line"
          />
          <circle cx="40" cy="50" r="5" fill="white" className="hero-promo-route-dot hero-promo-route-dot--a" />
          <circle cx="160" cy="110" r="5" fill="#FFC400" className="hero-promo-route-dot hero-promo-route-dot--b" />
        </svg>

        {/* Large background truck */}
        <div className="hero-promo-truck-bg" aria-hidden>
          <Truck size={100} strokeWidth={1} />
        </div>

        {/* Floating service icons */}
        {FLOATERS.map(({ Icon, label, className, size }) => (
          <div key={label} className={className} title={label} aria-hidden>
            <Icon size={size} strokeWidth={2} />
          </div>
        ))}

        {/* Shine sweep */}
        <div className="hero-promo-shine" aria-hidden />

        {/* Content */}
        <div className="hero-promo-content">
          <p className="hero-promo-title">Ready to move?</p>
          <p className="hero-promo-sub">Upfront price · movers across Canada</p>
          <Link to="/book" className="hero-promo-cta">
            Schedule ahead
            <ArrowRight size={16} className="text-accent" />
          </Link>
        </div>
      </div>
    </div>
  )
}
