"use client";

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

export default function CookieWrapper() {
  const pathname = usePathname();

  const hideBanner = ROUTES_WITHOUT_BANNER.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <>
      <MarketingPixels />
      {!hideBanner && <CookieManager />}
    </>
  );
}
