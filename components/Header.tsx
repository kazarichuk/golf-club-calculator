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
              className="h-8 w-auto"
            />
          </div>

          {/* Join Now Button */}
          <Button 
            className="bg-[#39934D] hover:bg-[#2d7a3d] text-white"
            size="sm"
          >
            Join Now
          </Button>
        </div>
      </div>
    </header>
  );
}
