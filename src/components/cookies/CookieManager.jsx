"use client";
import React, { useState, useEffect } from "react";
import { XIcon, Settings } from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
    const cookieConsent = localStorage.getItem('cookie_consent');
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

    window.addEventListener('openCookiePreferences', handleOpenPreferences);

    return () => {
      window.removeEventListener('openCookiePreferences', handleOpenPreferences);
    };
  }, [isMounted]);

  const handleAccept = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem('cookie_consent', JSON.stringify(allAccepted));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    closeBanner();
  };

  const handleDecline = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem('cookie_consent', JSON.stringify(onlyNecessary));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
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
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (cookieConsent) {
      closeBanner();
    }
  };

  return (
    <>
      {/* Cookie Banner */}
      {isVisible && (
        <div
          className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out ${
            isAnimating ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
        >
          <div className="bg-background max-w-[400px] rounded-md border p-4 shadow-lg">
            <div className="flex gap-2">
              <div className="flex grow flex-col gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Nous respectons votre vie privée 🍪</p>
                  <p className="text-muted-foreground text-sm">
                    Nous utilisons des cookies pour améliorer votre expérience et afficher du contenu personnalisé.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={handleAccept}>
                    Accepter
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDecline}>
                    Refuser
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCustomize}
                    className="gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Personnaliser
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                aria-label="Fermer la notification"
                onClick={closeBanner}
              >
                <XIcon
                  size={16}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Button>
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
