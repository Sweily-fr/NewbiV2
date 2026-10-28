"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CookieManager from "./CookieManager";
import MarketingPixels from "./MarketingPixels";

// /pdf-generator : pages de rendu de document (Puppeteer page.pdf() et WebView
// mobile) — un bandeau cookies s'y retrouverait imprimé dans le PDF.
const ROUTES_WITHOUT_BANNER = [
  "/dashboard",
  "/create-workspace",
  "/pdf-generator",
];

// Prise de rendez-vous intégrée sur le site d'un client (?embed=1, iframe) :
// le bandeau de Newbi n'a rien à faire dans son widget
function isEmbeddedBookingPage(pathname) {
  if (!pathname.startsWith("/rdv")) return false;
  try {
    return (
      new URLSearchParams(window.location.search).get("embed") === "1" ||
      window.self !== window.top
    );
  } catch {
    // Accès à window.top refusé : on est bien dans une iframe
    return true;
  }
}

export default function CookieWrapper() {
  const pathname = usePathname();
  const [embedded, setEmbedded] = useState(false);

  // Lu après le premier rendu : le rendu serveur ne connaît pas l'URL
  useEffect(() => {
    setEmbedded(isEmbeddedBookingPage(pathname || ""));
  }, [pathname]);

  const hideBanner =
    embedded ||
    ROUTES_WITHOUT_BANNER.some((route) => pathname.startsWith(route));

  return (
    <>
      <MarketingPixels />
      {!hideBanner && <CookieManager />}
    </>
  );
}
