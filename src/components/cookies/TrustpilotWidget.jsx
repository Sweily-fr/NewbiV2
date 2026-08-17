"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

function getFunctionalConsent() {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.functional === true;
  } catch {
    return false;
  }
}

/**
 * Widget Trustpilot (TrustBox - Review Collector).
 *
 * Le widget Trustpilot dépose des cookies de suivi : il n'est donc chargé
 * qu'après consentement « fonctionnel » de l'utilisateur (RGPD / recommandations
 * CNIL). Cette catégorie est opt-in (désactivée par défaut) dans le CMP, donc
 * aucun cookie n'est déposé tant que l'utilisateur n'a pas explicitement
 * accepté. Tant que le consentement n'est pas donné, ni le script ni le widget
 * ne sont rendus.
 */
export default function TrustpilotWidget({ className = "" }) {
  const [hasConsent, setHasConsent] = useState(false);
  const trustboxRef = useRef(null);

  useEffect(() => {
    // Consentement initial
    setHasConsent(getFunctionalConsent());

    // Changement de consentement depuis un autre onglet
    const handleStorage = (e) => {
      if (e.key === "cookie_consent") {
        setHasConsent(getFunctionalConsent());
      }
    };

    // Changement de consentement dans le même onglet (event custom)
    const handleConsentUpdate = () => {
      setHasConsent(getFunctionalConsent());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cookieConsentUpdated", handleConsentUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cookieConsentUpdated", handleConsentUpdate);
    };
  }, []);

  // Le script bootstrap n'initialise les widgets qu'au premier chargement, pas
  // lors des navigations SPA ni quand le consentement est donné après coup.
  // On force donc le rendu du widget dès qu'il est monté.
  const renderTrustbox = () => {
    if (window.Trustpilot && trustboxRef.current) {
      window.Trustpilot.loadFromElement(trustboxRef.current, true);
    }
  };

  useEffect(() => {
    if (hasConsent) renderTrustbox();
  }, [hasConsent]);

  if (!hasConsent) return null;

  return (
    <>
      {/* TrustBox script */}
      <Script
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
        onLoad={renderTrustbox}
      />
      {/* End TrustBox script */}
      {/* TrustBox widget - Review Collector */}
      {/*
        data-token : token PUBLIC du widget Trustpilot, destiné à être intégré
        en clair dans le HTML public (ce n'est pas un secret). On neutralise le
        faux positif gitleaks via le commentaire `gitleaks:allow` sur la ligne.
      */}
      <div className={className}>
        <div
          ref={trustboxRef}
          className="trustpilot-widget"
          data-locale="fr-FR"
          data-template-id="56278e9abfbbba0bdcd568bc"
          data-businessunit-id="6a37f47b64265226696b1838"
          data-style-height="52px"
          data-style-width="100%"
          data-token={
            "34292005-471a-40d8-8b95-d163aef06ceb" /* gitleaks:allow */
          }
        >
          <a
            href="https://fr.trustpilot.com/review/newbi.fr"
            target="_blank"
            rel="noopener"
          >
            Trustpilot
          </a>
        </div>
      </div>
      {/* End TrustBox widget */}
    </>
  );
}
