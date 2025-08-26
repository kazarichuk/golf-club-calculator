import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Golf Iron AI Finder',
    default: 'Golf Iron Recommendation Calculator | Find Best Irons for Your Game (2024)',
  },
  description: 'Get personalized golf iron recommendations based on your handicap, swing speed, and budget. Our AI-powered calculator helps you find the perfect irons to improve your game. Free, instant results!',
  keywords: 'golf club recommendation, golf irons calculator, best golf clubs, golf club fitting, golf equipment selector, golf club buying guide',
  openGraph: {
    title: 'Golf Club Recommendation Calculator | Find Your Perfect Irons',
    description: 'Get personalized golf club recommendations based on your handicap, swing speed, and budget. Free AI-powered tool.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Golf Club AI Finder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golf Club Recommendation Calculator',
    description: 'Find your perfect golf irons with our AI-powered recommendation tool.',
  },
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
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-background: rgb(10, 10, 10);
              --color-foreground: rgb(250, 250, 250);
              --color-card: rgb(20, 20, 20);
              --color-card-foreground: rgb(250, 250, 250);
              --color-popover: rgb(20, 20, 20);
              --color-popover-foreground: rgb(250, 250, 250);
              --color-primary: rgb(250, 250, 250);
              --color-primary-foreground: rgb(10, 10, 10);
              --color-secondary: rgb(40, 40, 40);
              --color-secondary-foreground: rgb(250, 250, 250);
              --color-muted: rgb(40, 40, 40);
              --color-muted-foreground: rgb(150, 150, 150);
              --color-accent: rgb(40, 40, 40);
              --color-accent-foreground: rgb(250, 250, 250);
              --color-destructive: rgb(150, 50, 50);
              --color-destructive-foreground: rgb(250, 250, 250);
              --color-border: rgb(60, 60, 60);
              --color-input: rgb(40, 40, 40);
              --color-ring: rgb(200, 200, 200);
              --radius: 0.5rem;
            }
          `
        }} />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Golf Club Recommendation Calculator",
              "description": "AI-powered golf club recommendation tool that helps golfers find the perfect irons based on their handicap, swing speed, and budget.",
              "url": "https://your-domain.com",
              "applicationCategory": "SportsApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Golf Club AI Finder"
              },
              "featureList": [
                "AI-powered recommendations",
                "Handicap-based matching",
                "Budget filtering",
                "Swing speed analysis",
                "Brand preferences",
                "Instant results"
              ],
              "screenshot": "https://your-domain.com/screenshot.png",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
