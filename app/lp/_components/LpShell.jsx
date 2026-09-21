"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SIGNUP_HREF, CTA_LABEL } from "./lp-config";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { cn } from "@/src/lib/utils";

// Coquille des LP : navbar, barre CTA sticky sur mobile une fois le hero
// dépassé, mini-footer légal.
// `navbar` :
//  - "minimal" (défaut) : logo non cliquable + Connexion discret + CTA. Aucun
//    autre lien sortant, le trafic payant ne s'échappe pas vers le blog ou le
//    mega-menu produits.
//  - "full" : la navbar complète du site (NewHeroNavbar), qui adapte ses CTA
//    quand elle détecte une LP Ads.
// `banner` : élément optionnel (ex. FacturationBanner) affiché au-dessus de la
// navbar complète. La navbar et le padding du contenu se décalent tant qu'il
// est visible ; il émet "banner-closed" quand l'utilisateur le ferme.
// `footer` : "minimal" (défaut, mini-footer légal) ou "full" (Footer7, le
// même que les pages produits).
// `flushTop` : sur desktop, le contenu démarre tout en haut (sous la navbar
// fixe) au lieu d'être décalé — pour un hero épinglé au scroll qui doit
// démarrer à scroll 0. Le décalage à appliquer est exposé en CSS via
// `--lp-top` (hauteur navbar + bannière visible).
export default function LpShell({
  children,
  navbar = "minimal",
  banner,
  footer = "minimal",
  flushTop = false,
}) {
  const [showSticky, setShowSticky] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(!!banner);

  useEffect(() => {
    if (!banner) return;
    const onClose = () => setBannerVisible(false);
    window.addEventListener("banner-closed", onClose);
    return () => window.removeEventListener("banner-closed", onClose);
  }, [banner]);

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
      {navbar === "full" ? (
        <>
          {banner}
          <NewHeroNavbar hasBanner={!!banner} />
        </>
      ) : (
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
                className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 whitespace-nowrap"
              >
                Connexion
              </Link>
              <Link
                href={SIGNUP_HREF}
                className="inline-flex items-center whitespace-nowrap rounded-lg bg-[#5b50FF] hover:bg-[#4a40e6] text-white text-sm font-medium px-3.5 sm:px-4 py-2 transition-colors"
              >
                {/* Libellé court sur mobile pour tenir sur une ligne */}
                <span className="sm:hidden">Essai gratuit</span>
                <span className="hidden sm:inline">{CTA_LABEL}</span>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* NewHeroNavbar fait 68px (py-4 + logo 36px), le header minimal 64px.
          Avec bannière visible : + 80px mobile / 58px desktop (cf. NewHeroNavbar). */}
      <div
        style={{ "--lp-top": bannerVisible ? "126px" : "68px" }}
        className={cn(
          navbar !== "full" && "pt-16",
          navbar === "full" && !bannerVisible && "pt-[68px]",
          navbar === "full" && bannerVisible && "pt-[148px] sm:pt-[126px]",
          flushTop && "lg:pt-0",
        )}
      >
        {children}
      </div>

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

      {footer === "full" ? (
        <div className="pb-20 lg:pb-0">
          <Footer7 />
        </div>
      ) : (
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
      )}
    </>
  );
}
