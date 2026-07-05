import { Link } from 'react-router-dom'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import PublicHeader from '../../components/layout/PublicHeader'
import HomeBookingWidget from '../../components/marketing/HomeBookingWidget'
import ServiceExploreGrid, { AccountCtaSection, PublicFooter } from '../../components/marketing/ServiceExploreGrid'
import Spinner from '../../components/ui/Spinner'
import { Truck } from 'lucide-react'

function HeroPromoCard() {
  return (
    <div className="relative hidden lg:block">
      <div className="aspect-square max-w-md ml-auto rounded-3xl overflow-hidden bg-gradient-to-br from-accent via-accent-hover to-ink shadow-soft">
        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
          <div className="absolute top-8 right-8 opacity-20">
            <Truck size={120} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
              <span className="text-5xl" role="img" aria-label="Moving boxes">📦</span>
            </div>
            <p className="text-2xl font-bold leading-tight mb-4">Ready to move?</p>
            <Link
              to="/book"
              className="inline-flex px-5 py-2.5 bg-white text-ink font-semibold rounded-full hover:bg-gray-100 transition text-sm"
            >
              Schedule ahead
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile promo strip */}
    </div>
  )
}

function MobilePromoBanner() {
  return (
    <div className="lg:hidden mt-8 rounded-2xl overflow-hidden bg-gradient-to-r from-accent to-accent-hover p-5 text-white flex items-center justify-between gap-4">
      <div>
        <p className="font-bold text-lg">Ready to move?</p>
        <p className="text-sm text-white/80 mt-0.5">Upfront price · local movers</p>
      </div>
      <Link
        to="/book"
        className="shrink-0 px-4 py-2 bg-white text-ink font-semibold rounded-full text-sm"
      >
        Book
      </Link>
    </div>
  )
}

export default function LandingPage() {
  const { isLoaded } = useGoogleMapsLoader()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      <main>
        {/* Hero — Uber-style split */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <HomeBookingWidget />
            <div>
              <HeroPromoCard />
              <MobilePromoBanner />
            </div>
          </div>
        </section>

        <ServiceExploreGrid />
        <AccountCtaSection />
      </main>

      <PublicFooter />
    </div>
  )
}
