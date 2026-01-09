'use client';

import React from 'react';
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface BrandedFooterProps {
  appName?: string;
  companyLinks?: FooterLink[];
  productLinks?: FooterLink[];
  supportLinks?: FooterLink[];
  legalLinks?: FooterLink[];
}

/**
 * Branded Footer Component
 * 
 * Standard footer for all CR AudioViz AI apps with:
 * - Company info & "Cindy & Roy" branding
 * - Navigation columns
 * - Social links
 * - Legal links
 * - Mobile-friendly tap targets
 */
export function BrandedFooter({
  appName = 'CR AudioViz AI',
  companyLinks = [
    { label: 'About', href: '/about' },
    { label: 'Apps', href: '/apps' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
  ],
  productLinks = [
    { label: 'Features', href: '/features' },
    { label: 'API', href: '/api' },
    { label: 'Integrations', href: '/integrations' },
  ],
  supportLinks = [
    { label: 'Help Center', href: '/support' },
    { label: 'Contact', href: '/contact' },
    { label: 'Status', href: '/status' },
  ],
  legalLinks = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookies', href: '/cookies' },
  ],
}: BrandedFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center min-h-[44px] text-sm text-slate-600 
                               dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400
                               transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center min-h-[44px] text-sm text-slate-600 
                               dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400
                               transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center min-h-[44px] text-sm text-slate-600 
                               dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400
                               transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center min-h-[44px] text-sm text-slate-600 
                               dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400
                               transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              {/* 3D Logo */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center
                             bg-gradient-to-br from-cyan-500 to-cyan-700
                             shadow-md shadow-cyan-500/20">
                <span className="text-white font-bold text-sm">CR</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                © {currentYear} CR AudioViz AI. A{' '}
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Cindy & Roy
                </span>{' '}
                Henderson Platform Production.
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {/* Twitter/X */}
              <a
                href="https://twitter.com/craudiovizai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full
                           text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400
                           hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/craudiovizai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full
                           text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400
                           hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              
              {/* GitHub */}
              <a
                href="https://github.com/CR-AudioViz-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full
                           text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400
                           hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default BrandedFooter;
