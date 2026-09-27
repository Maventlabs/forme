import type { Metadata } from 'next'
import { Geist_Mono, Instrument_Sans } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'FORME by Mavent',
  description: 'A wireframe-first design workspace for the way you build.',
  icons: { icon: '/brand/forme/forme-app-icon-light.png' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${instrument.variable} ${geistMono.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
