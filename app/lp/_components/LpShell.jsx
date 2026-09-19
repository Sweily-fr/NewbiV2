"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SIGNUP_HREF, CTA_LABEL } from "./lp-config";

// Coquille des LP : navbar minimale (logo non cliquable + Connexion discret +
// CTA), barre CTA sticky sur mobile une fois le hero dépassé, mini-footer
// légal. Aucun autre lien sortant : le trafic payant ne doit pas s'échapper
// vers le blog ou le mega-menu produits.
export default function LpShell({ children }) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("lp-hero");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[#FDFDFD]/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <img
            src="/newbiLetter.png"
            alt="Newbi"
            width="90"
            height="36"
            className="object-contain"
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
            >
              Connexion
            </Link>
            <Link
              href={SIGNUP_HREF}
              className="inline-flex items-center rounded-lg bg-[#5b50FF] hover:bg-[#4a40e6] text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              {CTA_LABEL}
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-16">{children}</div>

      {/* CTA sticky mobile : visible seulement quand le hero est sorti de l'écran */}
      <div
        aria-hidden={!showSticky}
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur border-t border-gray-200 transition-transform duration-300 ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Link
          href={SIGNUP_HREF}
          className="flex flex-col items-center justify-center w-full rounded-xl bg-[#5b50FF] text-white py-3"
        >
          <span className="text-base font-medium leading-tight">
            {CTA_LABEL}
          </span>
          <span className="text-xs text-white/75 leading-tight">
            30 jours offerts · sans carte bancaire
          </span>
        </Link>
      </div>

      <footer className="border-t border-gray-200 py-8 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Newbi · Sweily</span>
          <nav className="flex items-center gap-4">
            <Link href="/mentions-legales" className="hover:text-gray-900">
              Mentions légales
            </Link>
            <Link
              href="/politique-de-confidentialite"
              className="hover:text-gray-900"
            >
              Confidentialité
            </Link>
            <Link href="/cgv" className="hover:text-gray-900">
              CGV
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
