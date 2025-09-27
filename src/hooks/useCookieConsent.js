"use client";
import { useState, useEffect } from 'react';

export const useCookieConsent = () => {
  const [cookieConsent, setCookieConsent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent) {
      setCookieConsent(JSON.parse(consent));
    }
    setIsLoading(false);
  }, []);

  const updateConsent = (newConsent) => {
    setCookieConsent(newConsent);
    localStorage.setItem('cookie_consent', JSON.stringify(newConsent));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
  };

  const hasConsent = (type) => {
    if (!cookieConsent) return false;
    return cookieConsent[type] === true;
  };

  const openCookieSettings = () => {
    // Dispatch a custom event to open the preferences modal
    window.dispatchEvent(new CustomEvent('openCookiePreferences'));
  };

  return {
    cookieConsent,
    isLoading,
    updateConsent,
    hasConsent,
    openCookieSettings
  };
};
