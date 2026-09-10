// 2026-09-10 factory: embed policy (frame-ancestors) comes from the platform SDK.
const __embed = require('@craudioviz/platform-sdk/embed-headers.js');
// Build trigger: 1779135724
/** @type {import("next").NextConfig} */
const nextConfig={
      async headers() {
        // 2026-09-02: added after an ecosystem sweep found 58 of 60 live sites with
        // no CSP and weak or absent HSTS. This project had no headers() at all.
        //
        // HSTS is enforced immediately - it only tells the browser to refuse
        // plaintext, so there is nothing for it to break. CSP ships REPORT-ONLY
        // first: a policy that blocks a script the app needs takes the app down,
        // and it graduates to enforcing once the violation reports are quiet.
        return [
          {
            source: '/:path*',
            headers: [
              ...__embed.embedSecurityHeaders({ brandedDomain: 'javarimarket.com' }),
              { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
              { key: 'Content-Security-Policy-Report-Only', value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.paypal.com; frame-src 'self' https://js.stripe.com https://*.paypal.com; frame-ancestors 'self' https://craudiovizai.com https://www.craudiovizai.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests` },
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            ],
          },
        ];
      },

  // 2026-08-29: required for @craudioviz/platform-sdk. The SDK ships raw
  // TypeScript and Next does not run node_modules through SWC by default, so
  // any import carrying a `type` re-export fails the build without this.
  transpilePackages: ["@craudioviz/platform-sdk"],typescript:{ignoreBuildErrors:true},eslint:{ignoreDuringBuilds:true},reactStrictMode:false}
module.exports=nextConfig
