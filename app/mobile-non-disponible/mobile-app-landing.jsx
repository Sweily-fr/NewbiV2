"use client";

import { useEffect, useState } from "react";

// Liens stores officiels (voir aussi src/components/footer7.jsx).
const IOS_STORE_URL = "https://apps.apple.com/app/id6772126520";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=fr.newbi.app";

function AppleLogo({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function GooglePlayLogo({ className }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
      <path
        fill="#00D3FF"
        d="M47.9 33.5c-4.3 4.6-6.9 11.7-6.9 20.9v403.2c0 9.2 2.6 16.3 6.9 20.9l1.4 1.3 225.9-225.9v-5.3L49.3 32.2l-1.4 1.3z"
      />
      <path
        fill="#00F076"
        d="M350 331.9l-75.3-75.3v-5.3l75.4-75.4 1.7 1L441 233c25.7 14.6 25.7 38.5 0 53.1l-89.3 50.8-1.7 1z"
      />
      <path
        fill="#FF3946"
        d="M351.7 336.9L274.7 254 47.9 480.8c8.5 9 22.4 10.1 38.2 1.1l265.6-145z"
      />
      <path
        fill="#FFBC00"
        d="M351.7 175.1L86.1 30.1C70.3 21.1 56.4 22.2 47.9 31.2L274.7 254l77-78.9z"
      />
    </svg>
  );
}

export function MobileAppLanding() {
  const [platform, setPlatform] = useState(null); // "ios" | "android" | null

  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/Android/i.test(ua)) {
      setPlatform("android");
    } else if (
      /iPhone|iPad|iPod/i.test(ua) ||
      // iPadOS récent s'annonce comme un Mac tactile
      (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    ) {
      setPlatform("ios");
    }
  }, []);

  const isAndroid = platform === "android";
  const primaryUrl = isAndroid ? ANDROID_STORE_URL : IOS_STORE_URL;
  const secondaryUrl = isAndroid ? IOS_STORE_URL : ANDROID_STORE_URL;
  const secondaryLabel = isAndroid ? "l'App Store" : "Google Play";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      {/* Hero — mockup de l'app agrandi, descendu, avec fondu opaque en bas.
          flex-1 + overflow-hidden : le mockup se rogne au lieu de créer du scroll. */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden pt-10">
        <div className="flex justify-center">
          <img
            src="/mobile-app-preview.png"
            alt="Aperçu de l'application Newbi"
            className="w-[165%] max-w-none shrink-0 object-contain"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(to_bottom,transparent_0%,#ffffff_55%,#ffffff_100%)]" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 -mt-4 flex shrink-0 flex-col items-center px-6">
        <img src="/newbiLetter.png" alt="Newbi" className="h-8 w-auto" />
        <p className="mt-5 max-w-xs text-center text-[15px] leading-relaxed text-[#6b7280]">
          Gérez votre activité depuis l'application mobile.
        </p>
      </div>

      {/* Badge store officiel — épinglé en bas, selon le device */}
      <div className="shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] pt-4">
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={
            isAndroid
              ? "Disponible sur Google Play"
              : "Télécharger sur l'App Store"
          }
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black py-3 text-white transition-opacity active:opacity-80"
        >
          {isAndroid ? (
            <GooglePlayLogo className="size-7" />
          ) : (
            <AppleLogo className="size-7" />
          )}
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-medium tracking-wide text-white/85">
              {isAndroid ? "DISPONIBLE SUR" : "Télécharger dans l'"}
            </span>
            <span className="text-[19px] font-semibold leading-tight">
              {isAndroid ? "Google Play" : "App Store"}
            </span>
          </span>
        </a>
        <p className="mt-3 text-center text-[13px] text-[#9ca3af]">
          Disponible aussi sur{" "}
          <a
            href={secondaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#5b4fff] underline-offset-2 hover:underline"
          >
            {secondaryLabel}
          </a>
        </p>
      </div>
    </div>
  );
}
