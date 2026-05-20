// app/layout.tsx — javari-market
// Universal brand shell — EIN, auth CTA, metadata
// CR AudioViz AI · EIN 39-3646201 · May 2026
import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Javari Market Oracle',
  description: 'Javari Market Oracle — powered by Javari AI on the CR AudioViz AI platform',
  openGraph: { title: 'Javari Market Oracle', type: 'website' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ background: 'rgba(7,8,15,0.95)', backdropFilter: 'blur(8px)', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <a href="https://craudiovizai.com" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📈</span>
            <span style={{ color: '#3b82f6' }}>Javari Market Oracle</span>
            <span style={{ color: '#374151', fontSize: 10 }}>· CR AudioViz AI · EIN 39-3646201</span>
          </a>
          <a href="https://craudiovizai.com/auth/signup" style={{ background: '#3b82f6', color: '#000', borderRadius: 6, padding: '5px 14px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Sign Up Free →</a>
        </div>
        <div style={{ paddingTop: 48 }}>{children}</div>
        <footer style={{ background: '#050609', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ color: '#1f2937', fontSize: 11, margin: 0 }}>
            © 2026 CR AudioViz AI, LLC — EIN: 39-3646201 · Fort Myers, Florida ·{' '}
            <a href="https://craudiovizai.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>craudiovizai.com</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
