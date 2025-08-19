// /components/Footer.tsx
"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo-procaddie.svg"
              alt="Procaddie Logo"
              width={100}
              height={32}
              className="h-6 w-auto"
            />
          </div>

          {/* Contact Information */}
          <div className="text-center md:text-right">
            <span className="text-muted-foreground text-sm">
              mattia@procaddie.ai • ©2025 ProCaddie Limited
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
