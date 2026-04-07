import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { Toaster } from "@/src/components/ui/sonner";
import { DevAnimationTrigger } from "@/src/components/dev-animation-trigger";
import CookieManager from "@/src/components/cookies/CookieManager";
import "@/src/utils/clearApolloCache"; // Nettoyage du cache Apollo

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: {
    default: "Newbi - Solution complète pour freelances et petites entreprises",
    template: "%s | Newbi",
  },
  description:
    "Newbi simplifie la gestion de votre activité : devis, factures, signatures électroniques, transferts de fichiers et gestion de projets. Tout-en-un pour freelances et petites entreprises.",
  keywords: [
    "freelance",
    "facturation",
    "devis",
    "signature électronique",
    "gestion projet",
    "transfert fichiers",
    "petite entreprise",
    "auto-entrepreneur",
  ],
  authors: [{ name: "Newbi" }],
  creator: "Newbi",
  publisher: "Newbi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Newbi - Solution complète pour freelances et petites entreprises",
    description:
      "Simplifiez votre activité avec Newbi : devis, factures, signatures électroniques, transferts de fichiers et gestion de projets.",
    url: "/",
    siteName: "Newbi",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/images/op-newbi.png",
        width: 1200,
        height: 630,
        alt: "Newbi - Solution complète pour freelances",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Newbi - Solution complète pour freelances et petites entreprises",
    description:
      "Simplifiez votre activité avec Newbi : devis, factures, signatures électroniques, transferts de fichiers et gestion de projets.",
    images: ["/images/op-newbi.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
      translate="no"
    >
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5HP9SHS9');`,
          }}
        />
        {/* End Google Tag Manager */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Newbi" />
        <meta name="theme-color" content="#5b4fff" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vite-ui-theme') || 'system';
                  var path = window.location.pathname;
                  var isDarkAllowed = path.startsWith('/dashboard') || path.startsWith('/create-workspace');

                  if (!isDarkAllowed) {
                    document.documentElement.classList.add('light');
                    return;
                  }

                  if (theme === 'system') {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.classList.add(systemTheme);
                  } else {
                    document.documentElement.classList.add(theme);
                  }
                } catch (e) {
                  var st = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(st);
                }
              })();

              // Detecter les erreurs de chunks stale (apres un nouveau deploiement Vercel).
              // Auto-reload la page au lieu d'afficher une erreur cryptique.
              window.addEventListener('error', function(e) {
                // Ne reloader que pour les vrais chunks stale (fichiers .js),
                // pas pour les erreurs JSON parse d'API (ex: MongoDB down retourne du HTML)
                var filename = e.filename || '';
                var isFromScript = filename.indexOf('.js') !== -1 || filename.indexOf('_next') !== -1;
                var msg = (e.message || '') + ' ' + filename;
                var isChunk = (msg.indexOf('ChunkLoadError') !== -1 ||
                              msg.indexOf('Loading chunk') !== -1 ||
                              msg.indexOf('dynamically imported module') !== -1 ||
                              (msg.indexOf('Unexpected token') !== -1 && isFromScript));
                if (isChunk) {
                  var key = 'chunk_reload_' + window.location.pathname;
                  var last = sessionStorage.getItem(key);
                  var now = Date.now();
                  if (!last || now - parseInt(last, 10) > 30000) {
                    sessionStorage.setItem(key, now.toString());
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
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
        {/* TikTok Pixel Code */}
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
              var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
              ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

              ttq.load('D4I179RC77U1VUV8N450');
              ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
        <ApolloWrapper>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            {children}
            <CookieManager />
          </ThemeProvider>
        </ApolloWrapper>
        <Toaster />
        <DevAnimationTrigger />
      </body>
    </html>
  );
}
