"use client";

import { useState, useEffect } from "react";
import { XIcon, TrendingUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export function TresorerieBanner() {
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
      className={`fixed top-0 left-0 right-0 z-[99] bg-[#1D1D1B] text-white px-4 py-2.5 transition-transform duration-300 ${
        isScrolled ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-white/10 flex size-8 shrink-0 items-center justify-center rounded-full">
            <TrendingUp className="text-white" size={14} />
          </div>
          <p className="text-sm">
            Optimisez votre gestion de trésorerie avec notre{" "}
            <span className="font-semibold">logiciel tout-en-un</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/produits/tresorerie#features">
            <Button
              size="sm"
              className="bg-white text-[#1D1D1B] hover:bg-gray-100 text-sm font-medium rounded-md px-4"
            >
              Découvrir
            </Button>
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Fermer le banner"
          >
            <XIcon size={16} className="opacity-60 hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
