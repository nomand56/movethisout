import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import PublicHeader from '../../components/layout/PublicHeader'
import HomeBookingWidget from '../../components/marketing/HomeBookingWidget'
import HeroPromoCard from '../../components/marketing/HeroPromoCard'
import ServiceExploreGrid, { AccountCtaSection, PublicFooter } from '../../components/marketing/ServiceExploreGrid'
import Spinner from '../../components/ui/Spinner'

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
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <HomeBookingWidget />
            <HeroPromoCard />
          </div>
        </section>

        <ServiceExploreGrid />
        <AccountCtaSection />
      </main>

      <PublicFooter />
    </div>
  )
}
