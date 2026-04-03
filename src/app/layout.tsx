import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://modernsite.com'),
  title: {
    default: 'ModernSite - Professional Web Development Services',
    template: '%s | ModernSite'
  },
  description: 'Professional web development services including responsive design, e-commerce solutions, and mobile app development. Transform your digital presence with our modern, fast, and secure websites.',
  keywords: [
    'web development',
    'responsive design',
    'nextjs',
    'react',
    'tailwind css',
    'e-commerce',
    'mobile development',
    'ui/ux design',
    'modern website',
    'professional web services'
  ],
  authors: [{ name: 'ModernSite Team' }],
  creator: 'ModernSite',
  publisher: 'ModernSite',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://modernsite.com',
    title: 'ModernSite - Professional Web Development Services',
    description: 'Professional web development services including responsive design, e-commerce solutions, and mobile app development.',
    siteName: 'ModernSite',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ModernSite - Professional Web Development',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ModernSite - Professional Web Development Services',
    description: 'Professional web development services including responsive design, e-commerce solutions, and mobile app development.',
    images: ['/og-image.jpg'],
    creator: '@modernsite',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}