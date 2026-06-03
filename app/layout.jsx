import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { Toaster } from "@/src/components/ui/sonner";
import { DevAnimationTrigger } from "@/src/components/dev-animation-trigger";
import CookieWrapper from "@/src/components/cookies/CookieWrapper";
import "@/src/utils/clearApolloCache"; // Nettoyage du cache Apollo

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
        <ApolloWrapper>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            {children}
            <CookieWrapper />
          </ThemeProvider>
        </ApolloWrapper>
        <Toaster />
        {/* <DevAnimationTrigger /> */}
      </body>
    </html>
  );
}
