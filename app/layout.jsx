import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { Toaster } from "@/src/components/ui/sonner";
// import CookieManager from "@/src/components/cookies/CookieManager";
import "@/src/utils/clearApolloCache"; // Nettoyage du cache Apollo

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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr"
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
      { url: "/icon.png", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.png",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Newbi" />
        <meta name="theme-color" content="#5b4fff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('vite-ui-theme') || 'system';
                  const isDashboard = window.location.pathname.startsWith('/dashboard');
                  
                  if (!isDashboard) {
                    document.documentElement.classList.add('light');
                    return;
                  }
                  
                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.classList.add(systemTheme);
                  } else {
                    document.documentElement.classList.add(theme);
                  }
                } catch (e) {
                  // Fallback en cas d'erreur
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(systemTheme);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
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
            {/* <CookieManager /> */}
          </ThemeProvider>
        </ApolloWrapper>
        <Toaster />
      </body>
    </html>
  );
}
