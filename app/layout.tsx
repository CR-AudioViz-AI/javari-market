// app/layout.tsx — javari-market
// Server-rendered shell: brand, metadata, EIN, auth CTA in HTML for SEO + production
// CR AudioViz AI, LLC · EIN: 39-3646201 · May 2026
import type { Metadata } from 'next'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Javari Market Oracle',
  description: 'Live stock market data, AI-powered picks auto-generated at 9:35 AM ET on market days.',
  keywords: ['Javari AI', 'CR AudioViz AI', 'Javari Market Oracle', 'artificial intelligence'],
  authors: [{ name: 'CR AudioViz AI, LLC' }],
  creator: 'CR AudioViz AI, LLC',
  publisher: 'CR AudioViz AI, LLC',
  openGraph: {
    title: 'Javari Market Oracle',
    description: 'Live stock market data, AI-powered picks auto-generated at 9:35 AM ET on market days.',
    siteName: 'Javari Market Oracle',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {/* Server-rendered brand bar — visible in HTML, no JS required */}
        <div style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 200 }}>
          <a href="https://craudiovizai.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
            <span>📈</span>
            <span style={{ color: '#3b82f6' }}>Javari Market Oracle</span>
            <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 4 }}>by CR AudioViz AI · EIN 39-3646201</span>
          </a>
          <a href="https://craudiovizai.com/auth/signup" style={{ background: '#3b82f6', color: '#000', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Live Data →
          </a>
        </div>
        {children}
        {/* Server-rendered footer — EIN always in HTML */}
        <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ color: '#374151', fontSize: 11, margin: '0 0 4px', fontFamily: 'system-ui' }}>
            © 2026 CR AudioViz AI, LLC — EIN: 39-3646201 · Fort Myers, Florida
          </p>
          <p style={{ color: '#1f2937', fontSize: 11, margin: 0, fontFamily: 'system-ui' }}>
            Your Story. Our Design. Everyone Connects. Everyone Wins. ·{' '}
            <a href="https://craudiovizai.com" style={{ color: '#374151', textDecoration: 'none' }}>craudiovizai.com</a>
            {' '}·{' '}
            <a href="https://craudiovizai.com/auth/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Sign Up Free</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
