"use client";

import { usePathname } from "next/navigation";
import CookieManager from "./CookieManager";
import MarketingPixels from "./MarketingPixels";

const ROUTES_WITHOUT_BANNER = ["/dashboard", "/create-workspace"];

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
