// /components/Header.tsx
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Header() {
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo-procaddie.svg"
              alt="Procaddie Logo"
              width={120}
              height={40}
              className="h-6 w-auto sm:h-8"
            />
          </div>

          {/* Join Now Button */}
          <Button 
            className="bg-[#39934D] hover:bg-[#2d7a3d] text-white text-xs sm:text-sm"
            size="sm"
            asChild
          >
            <a href="https://procaddie.ai/" target="_blank" rel="noopener noreferrer">
              Join Now
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
