import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'MoveThisOut — Bought it? We\'ll move it. →',
  description: 'Post a load, get matched with a nearby mover. One couch. No U-Haul.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
