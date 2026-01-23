"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export function SynchronisationBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const bannerClosed = localStorage.getItem("synchronisationBannerClosed");
    if (bannerClosed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("synchronisationBannerClosed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm sm:text-base font-medium">
            🔒 Synchronisation bancaire sécurisée certifiée DSP2 -{" "}
            <span className="font-semibold">
              Connectez vos comptes en toute sécurité
            </span>
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Fermer la bannière"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
