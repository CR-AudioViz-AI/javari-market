import { ThemeProvider, BrandedHeader, BrandedFooter } from '@craudioviz/platform-sdk'
import './globals.css'
// app/layout.tsx — server-rendered brand shell
// CR AudioViz AI · EIN: 39-3646201 · May 2026
import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Javari Market Oracle',
  description: 'Live market data, AI stock picks generated at 9:35 AM ET on market days.',
  openGraph: { title: 'Javari Market Oracle', description: 'Live market data, AI stock picks generated at 9:35 AM ET on market days.', type: 'website' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {/* 2026-09-07: platform chrome from the SDK.
            ThemeProvider is REQUIRED - BrandedHeader renders ThemeToggle, which
            calls useTheme, which THROWS without a provider above it. A green
            build and a 500 on every render. */}
        <ThemeProvider>
        <BrandedHeader
          appName="Javari Market"
          quickLinks={[
            { label: 'All Apps', href: 'https://craudiovizai.com/apps' },
            { label: 'Games', href: 'https://craudiovizai.com/games' },
            { label: 'Tools', href: 'https://craudiovizai.com/tools' },
            { label: 'Market', href: 'https://craudiovizai.com/market' },
            { label: 'Pricing', href: 'https://craudiovizai.com/pricing' },
            { label: 'Help', href: 'https://craudiovizai.com/help' },
          ]}
        />

        {/* 2026-09-10: WCAG 2.4.1. Without this a keyboard user traverses the
            entire navigation on every page before reaching anything. Visually
            hidden until focused, which is the point - it is for people who are
            not using a mouse, and it appears the moment they tab. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline focus:outline-2"
        >
          Skip to main content
        </a>

        <div style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 200 }}>
          <a href="https://craudiovizai.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 600 }}>
            <span>📈</span>
            <span style={{ color: '#3b82f6' }}>Javari Market Oracle</span>
            <span style={{ color: '#374151', fontSize: 11, marginLeft: 4 }}>· CR AudioViz AI · EIN 39-3646201</span>
          </a>
          <a href="https://craudiovizai.com/auth/signup" style={{ background: '#3b82f6', color: '#000', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Free to Start →
          </a>
        </div>
        {children}
        <footer style={{ background: '#050608', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ color: '#1f2937', fontSize: 11, margin: 0, fontFamily: 'system-ui' }}>
            © 2026 CR AudioViz AI, LLC — EIN: 39-3646201 · Fort Myers, Florida · Your Story. Our Design. ·{' '}
            <a href="https://craudiovizai.com" style={{ color: '#374151', textDecoration: 'none' }}>craudiovizai.com</a>
            {' '}·{' '}
            <a href="https://craudiovizai.com/auth/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Sign Up Free</a>
          </p>
        </footer>
        <BrandedFooter appName="Javari Market" />
        </ThemeProvider>
      </body>
    </html>
  )
}
