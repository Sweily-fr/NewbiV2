"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { X, Settings } from "lucide-react";
import { cn } from "@/src/lib/utils";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
  }, [isMounted]);

  const handleAcceptAll = () => {
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

  const handleRejectAll = () => {
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
    // Redirect to cookies page for full customization
    window.location.href = '/cookies';
  };

  const closeBanner = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isAnimating ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Banner content */}
      <div className="relative bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    Préférences de Cookies
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Ce centre de préférences vous permet de personnaliser l'utilisation des cookies sur notre site. 
                    Nous utilisons différents types de cookies pour optimiser votre expérience et nos services. 
                    Pour plus d'informations, consultez notre{" "}
                    <a 
                      href="/politique-de-confidentialite" 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      politique de confidentialité
                    </a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="text-xs h-8 px-3"
              >
                Tout refuser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomize}
                className="text-xs h-8 px-3 gap-1"
              >
                <Settings className="w-3 h-3" />
                Personnaliser
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700"
              >
                Tout accepter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeBanner}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
