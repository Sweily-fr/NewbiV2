"use client";

import { useState, useEffect } from "react";
import { XIcon, Zap } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export function FacturationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed m-2 rounded-md top-0 left-0 right-0 z-[99] bg-[#5A50FF]/30 text-white px-4 py-2.5 transition-transform duration-300 ${
        isScrolled ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-white/20 flex size-8 shrink-0 items-center justify-center rounded-full">
            <Zap className="text-[#202020]" size={14} />
          </div>
          <p className="text-sm text-[#202020]">
            Passez à la facturation électronique dès maintenant avec notre outil{" "}
            <span className="font-semibold">100% conforme</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/produits/factures#features" className="hidden sm:block">
            <Button size="sm">Découvrir</Button>
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Fermer le banner"
          >
            <XIcon
              size={16}
              className="text-[#202020] opacity-60 hover:opacity-100"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
