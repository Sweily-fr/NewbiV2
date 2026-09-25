"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import CookiePreferencesModal from "./CookiePreferencesModal";

export default function CookieManager() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookie_consent");
    if (!cookieConsent) {
      // Small delay for better UX
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
    }

    // Listen for custom event to open preferences modal
    const handleOpenPreferences = () => {
      setShowPreferencesModal(true);
    };

    window.addEventListener("openCookiePreferences", handleOpenPreferences);

    return () => {
      window.removeEventListener(
        "openCookiePreferences",
        handleOpenPreferences,
      );
    };
  }, [isMounted]);

  const handleAccept = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem("cookie_consent", JSON.stringify(allAccepted));
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    window.dispatchEvent(new Event("cookieConsentUpdated"));
    closeBanner();
  };

  const handleDecline = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem("cookie_consent", JSON.stringify(onlyNecessary));
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    window.dispatchEvent(new Event("cookieConsentUpdated"));
    closeBanner();
  };

  const handleCustomize = () => {
    setShowPreferencesModal(true);
  };

  const closeBanner = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handlePreferencesClose = () => {
    setShowPreferencesModal(false);
    // Check if preferences were saved, if so close the banner
    const cookieConsent = localStorage.getItem("cookie_consent");
    if (cookieConsent) {
      closeBanner();
    }
  };

  return (
    <>
      {/* Fenêtre de consentement centrée : carte blanche large à coins très
          arrondis, lien vers la politique à gauche et les deux actions à
          droite — « Tout accepter » sur une pastille grise. */}
      {isVisible && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          <div
            className={`relative w-full max-w-[780px] rounded-[28px] bg-white px-8 py-8 md:px-11 md:py-10 shadow-[0_24px_70px_rgba(0,0,0,0.20)] transition-all duration-300 ease-out ${
              isAnimating ? "translate-y-0 scale-100" : "translate-y-3 scale-95"
            }`}
          >
            <h2
              id="cookie-title"
              className="text-[20px] md:text-[22px] font-semibold tracking-tight text-gray-950"
            >
              On utilise des cookies 🍪
            </h2>
            <p className="mt-4 text-[15px] md:text-[16px] leading-relaxed text-gray-600 max-w-[34rem]">
              Pour améliorer ton expérience sur Newbi, on utilise des cookies
              pour la mesure d&apos;audience, la personnalisation et la sécurité
              des transactions.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <Link
                href="/politique-de-confidentialite"
                className="inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-medium text-gray-950 underline underline-offset-4 decoration-1 hover:opacity-70 transition-opacity"
              >
                Politique de confidentialité
                <ChevronRight className="size-4" strokeWidth={2} />
              </Link>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="whitespace-nowrap rounded-2xl px-3.5 py-3.5 text-[13px] font-medium uppercase tracking-wide text-gray-950 transition-colors hover:bg-black/[0.04]"
                >
                  Fermer &amp; refuser
                </button>
                <button
                  type="button"
                  onClick={handleCustomize}
                  className="whitespace-nowrap rounded-2xl px-3.5 py-3.5 text-[13px] font-medium uppercase tracking-wide text-gray-950 transition-colors hover:bg-black/[0.04]"
                >
                  Personnaliser
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="whitespace-nowrap rounded-2xl bg-[#e6e6e6] px-6 py-3.5 text-[13px] font-medium uppercase tracking-wide text-gray-950 transition-colors hover:bg-[#dcdcdc]"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <CookiePreferencesModal
        isOpen={showPreferencesModal}
        onClose={handlePreferencesClose}
      />
    </>
  );
}
