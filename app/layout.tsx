// app/layout.tsx — server-rendered brand shell
// CR AudioViz AI · EIN: 39-3646201 · May 2026
// globals.css MUST stay imported. Next emits a stylesheet link only for CSS
// reachable from the module graph; without this import the site served raw
// unstyled HTML while every build passed.
import './globals.css'
import type { Metadata } from 'next'
import { EmbedBridge, EMBED_PREPAINT_SCRIPT } from '@craudioviz/platform-sdk'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Javari Market Oracle',
  description: 'Six named AI models each pick one stock a day from the same research, scored publicly on what really happens. Research only - not investment advice.',
  openGraph: { title: 'Javari Market Oracle', description: 'Six named AI models each pick one stock a day from the same research, scored publicly on what really happens. Research only - not investment advice.', type: 'website' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* factory 2026-09-10: marks an embedded page before first paint */}
        <script dangerouslySetInnerHTML={{ __html: EMBED_PREPAINT_SCRIPT }} />
      </head>
      {/* 2026-09-11: the page had NO background colour. Every old page painted its own
          dark panel, so nothing looked wrong until a page relied on the canvas - then
          white headings rendered white-on-white and simply vanished. The shell owns the
          background now; dark panels sit on top of it unchanged. */}
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#05070b', color: '#e5e7eb', colorScheme: 'dark', minHeight: '100vh' }}>
        <EmbedBridge />
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

        {/* One line on a phone: the brand truncates, the EIN is desktop-only. It used to
            wrap to three lines and push the page down. */}
        <div data-app-chrome style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44, position: 'relative', zIndex: 200 }}>
          <a href="https://craudiovizai.com" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span aria-hidden>📈</span>
            <span style={{ color: '#38bdf8' }}>Javari Market Oracle</span>
            <span className="hidden sm:inline" style={{ color: '#4b5563', fontSize: 11 }}>· CR AudioViz AI · EIN 39-3646201</span>
          </a>
          <a href="https://craudiovizai.com/auth/signup" style={{ background: '#38bdf8', color: '#04121c', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Free to Start →
          </a>
        </div>
        {children}
        <footer data-app-chrome style={{ background: '#050608', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ color: '#1f2937', fontSize: 11, margin: 0, fontFamily: 'system-ui' }}>
            © 2026 CR AudioViz AI, LLC — EIN: 39-3646201 · Fort Myers, Florida · Your Story. Our Design. ·{' '}
            <a href="https://craudiovizai.com" style={{ color: '#374151', textDecoration: 'none' }}>craudiovizai.com</a>
            {' '}·{' '}
            <a href="https://craudiovizai.com/auth/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Sign Up Free</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
