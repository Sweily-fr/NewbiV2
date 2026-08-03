"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Download } from "lucide-react";

// Liens stores officiels (voir aussi src/components/footer7.jsx).
const IOS_APP_ID = "6772126520";
const IOS_STORE_URL = `https://apps.apple.com/app/id${IOS_APP_ID}`;
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=fr.newbi.app";

const DISMISS_KEY = "app_install_banner_dismissed";
const DISMISS_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 jours

/**
 * Banner d'installation de l'app mobile, façon "Smart App Banner" iOS.
 *
 * Sur Safari iOS, le banner NATIF est déjà géré par la balise
 * <meta name="apple-itunes-app"> (voir app/layout.jsx) : on n'affiche donc
 * PAS ce composant pour éviter le doublon.
 *
 * Ce composant est le fallback custom (calqué sur le natif) pour les cas où
 * le banner natif n'existe pas : Android (tous navigateurs) et iOS hors-Safari
 * (Chrome/Firefox iOS, etc.).
 */
export function AppInstallBanner() {
  const [platform, setPlatform] = useState(null); // "ios" | "android" | null
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const bannerRef = useRef(null);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    // Ni téléphone ni tablette mobile → pas de banner.
    if (!isIOS && !isAndroid) return;

    // Déjà installé / lancé en standalone (PWA ou app) → inutile.
    if (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone
    ) {
      return;
    }

    // Safari iOS affiche le banner NATIF → on laisse le natif faire le travail.
    const isIOSSafari =
      isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
    if (isIOSSafari) return;

    // Respecter un rejet récent.
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (
        dismissed &&
        Date.now() - parseInt(dismissed, 10) < DISMISS_DURATION
      ) {
        return;
      }
    } catch {
      // localStorage indisponible : on continue, best-effort.
    }

    setPlatform(isIOS ? "ios" : "android");
    setVisible(true);
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // best-effort
    }
    setVisible(false);
  };

  // La page /mobile-non-disponible est déjà un CTA de téléchargement plein écran.
  const shown = visible && !!platform && pathname !== "/mobile-non-disponible";

  // Expose la hauteur du banner via --app-banner-h pour que la navbar (fixed)
  // et le contenu (body) se décalent en dessous (voir globals.css + navbar).
  useEffect(() => {
    const root = document.documentElement;
    if (shown && bannerRef.current) {
      root.style.setProperty(
        "--app-banner-h",
        `${bannerRef.current.offsetHeight}px`,
      );
    } else {
      root.style.setProperty("--app-banner-h", "0px");
    }
    return () => root.style.setProperty("--app-banner-h", "0px");
  }, [shown]);

  if (!shown) return null;

  const isIOS = platform === "ios";
  const storeUrl = isIOS ? IOS_STORE_URL : ANDROID_STORE_URL;

  return (
    <div
      ref={bannerRef}
      className="fixed inset-x-0 top-0 z-[100] border-b border-black/10 bg-white px-2 pt-[env(safe-area-inset-top,0px)] text-[#000]"
      role="dialog"
      aria-label="Installer l'application Newbi"
    >
      <div className="flex h-[72px] items-center gap-2">
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#8a8a8e] transition-colors hover:bg-black/5"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        <img
          src="/newbi.svg"
          alt="Newbi"
          className="size-9 shrink-0 rounded-[10px] object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#1c1c1e]">
            Newbi
          </p>
          <p className="truncate text-[13px] leading-tight text-[#8a8a8e]">
            Télécharger l'application
          </p>
        </div>

        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Télécharger l'application"
          className="flex size-9 shrink-0 items-center justify-center text-[#5b4fff] transition-opacity active:opacity-60"
        >
          <Download className="size-6" strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}
