import Script from 'next/script';
import type { Metadata, Viewport } from 'next'
// next/font/google removed — use system font stack
import './globals.css'

const inter = { className: 'font-sans' }; // system font fallback
export const metadata: Metadata = {
  title: 'Market Oracle AI | Multi-AI Stock Analysis',
  description: 'Part of the CR AudioViz AI creative ecosystem',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.className} min-h-screen min-h-[100dvh]`}>
        <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
        <Script src="https://javariai.com/embed.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
