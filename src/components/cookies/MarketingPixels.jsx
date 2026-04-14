"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

function getMarketingConsent() {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.marketing === true;
  } catch {
    return false;
  }
}

export default function MarketingPixels() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check initial consent
    setHasConsent(getMarketingConsent());

    // Listen for consent changes (when user accepts/saves preferences)
    const handleStorage = (e) => {
      if (e.key === "cookie_consent") {
        setHasConsent(getMarketingConsent());
      }
    };

    // Listen for localStorage changes from same tab (custom event)
    const handleConsentUpdate = () => {
      setHasConsent(getMarketingConsent());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cookieConsentUpdated", handleConsentUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cookieConsentUpdated", handleConsentUpdate);
    };
  }, []);

  if (!hasConsent) return null;

  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5HP9SHS9');`,
        }}
      />
      {/* End Google Tag Manager */}

      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-5HP9SHS9"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      {/* End Google Tag Manager (noscript) */}

      {/* Meta Pixel Code */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1623304648896676');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1623304648896676&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}
    </>
  );
}
