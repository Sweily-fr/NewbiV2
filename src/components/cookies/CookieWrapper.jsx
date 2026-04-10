"use client";

import { usePathname } from "next/navigation";
import CookieManager from "./CookieManager";
import MarketingPixels from "./MarketingPixels";

const AUTHENTICATED_ROUTES = ["/dashboard", "/onboarding", "/create-workspace"];

export default function CookieWrapper() {
  const pathname = usePathname();

  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isAuthenticatedRoute) return null;

  return (
    <>
      <MarketingPixels />
      <CookieManager />
    </>
  );
}
