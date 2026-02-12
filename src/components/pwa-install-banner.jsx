"use client";

import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

const DISMISS_KEY = "pwa_install_banner_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Don't show if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone) return;

    // Don't show on desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION) return;

    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));

    // Listen for beforeinstallprompt (Chrome/Android)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] left-3 right-3 z-[85] md:hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border/50 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#5b4fff]/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-[#5b4fff]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Installer Newbi
          </p>
          <p className="text-xs text-[#3D3E42] mt-0.5">
            {isIOS
              ? <>Appuyez sur <Share className="inline w-3.5 h-3.5 -mt-0.5" /> puis &quot;Sur l&apos;écran d&apos;accueil&quot;</>
              : "Ajoutez Newbi sur votre écran d'accueil pour une meilleure expérience"}
          </p>
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-2 px-4 py-1.5 text-xs font-semibold text-white bg-[#5b4fff] rounded-lg hover:bg-[#4a3fee] transition-colors"
            >
              Installer
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-accent transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-[#3D3E42]" />
        </button>
      </div>
    </div>
  );
}
