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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
