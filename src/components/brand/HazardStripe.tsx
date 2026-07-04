export default function HazardStripe({ className = '' }: { className?: string }) {
  return <div className={`hazard-stripe w-full ${className}`} aria-hidden />
}
