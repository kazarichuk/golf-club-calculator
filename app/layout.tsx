import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Golf Club Calculator",
  description: "Get personalized golf club recommendations based on your handicap and goals",
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
              --color-background: 222.2 84% 4.9%;
              --color-foreground: 210 40% 98%;
              --color-card: 222.2 84% 4.9%;
              --color-card-foreground: 210 40% 98%;
              --color-popover: 222.2 84% 4.9%;
              --color-popover-foreground: 210 40% 98%;
              --color-primary: 210 40% 98%;
              --color-primary-foreground: 222.2 47.4% 11.2%;
              --color-secondary: 217.2 32.6% 17.5%;
              --color-secondary-foreground: 210 40% 98%;
              --color-muted: 217.2 32.6% 17.5%;
              --color-muted-foreground: 215 20.2% 65.1%;
              --color-accent: 217.2 32.6% 17.5%;
              --color-accent-foreground: 210 40% 98%;
              --color-destructive: 0 62.8% 30.6%;
              --color-destructive-foreground: 210 40% 98%;
              --color-border: 217.2 32.6% 17.5%;
              --color-input: 217.2 32.6% 17.5%;
              --color-ring: 212.7 26.8% 83.9%;
              --radius: 0.5rem;
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
