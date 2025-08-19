// /components/Footer.tsx
"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
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
          <div className="text-white text-sm">
            <span className="text-muted-foreground">
              mattia@procaddie.ai • ©2025 ProCaddie Limited
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
