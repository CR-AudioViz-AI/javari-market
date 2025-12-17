'use client';

import { ExternalLink } from 'lucide-react';

const MAIN_SITE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://craudiovizai.com';

const apps = [
  { name: 'Market Oracle', url: 'https://crav-market-oracle.vercel.app', desc: 'AI Stock Analysis' },
  { name: 'Games Hub', url: 'https://crav-games-hub.vercel.app', desc: '1200+ Games' },
  { name: 'Logo Studio', url: 'https://crav-logo-studio.vercel.app', desc: 'AI Logo Creation' },
  { name: 'PDF Builder', url: 'https://crav-pdf-builder.vercel.app', desc: 'Professional PDFs' },
  { name: 'eBook Creator', url: 'https://crav-ebook-creator.vercel.app', desc: 'Publish eBooks' },
  { name: 'Invoice Generator', url: 'https://crav-invoice-generator.vercel.app', desc: 'Professional Invoices' },
];

export default function CrossMarketingFooter() {
  return (
    <footer className="border-t border-gray-800 mt-auto bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">CR AudioViz AI</h3>
            <p className="text-gray-400 text-sm mb-4">"Your Story. Our Design" - AI-powered tools for creators and businesses.</p>
            <a href={MAIN_SITE} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2">
              Visit Main Site <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Explore Our Apps</h3>
            <ul className="space-y-2">
              {apps.slice(0, 4).map(app => (
                <li key={app.name}>
                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
                    {app.name} <span className="text-gray-600">• {app.desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href={`${MAIN_SITE}/help`} className="text-gray-400 hover:text-white text-sm">Help Center</a></li>
              <li><a href={`${MAIN_SITE}/contact`} className="text-gray-400 hover:text-white text-sm">Contact Us</a></li>
              <li><a href={`${MAIN_SITE}/credits`} className="text-gray-400 hover:text-white text-sm">Buy Credits</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} CR AudioViz AI, LLC. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <a href={`${MAIN_SITE}/privacy`} className="text-gray-500 hover:text-white">Privacy</a>
            <a href={`${MAIN_SITE}/terms`} className="text-gray-500 hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
