import { MoverNavbar } from '@/components/mover-navbar'

export const metadata = {
  title: 'MoveThisOut — Mover Portal',
  description: 'Browse move requests, send offers, and earn community trust.',
}

export default function MoverAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MoverNavbar />
      <main className="flex-1">{children}</main>
    </>
  )
}
