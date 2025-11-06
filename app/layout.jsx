import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { Toaster } from "@/src/components/ui/sonner";
import CookieManager from "@/src/components/cookies/CookieManager";
import "@/src/utils/clearApolloCache"; // Nettoyage du cache Apollo

export const metadata = {
  title: {
    default: "Newbi - Solution complète pour freelances et petites entreprises",
    template: "%s | Newbi"
  },
  description: "Newbi simplifie la gestion de votre activité : devis, factures, signatures électroniques, transferts de fichiers et gestion de projets. Tout-en-un pour freelances et petites entreprises.",
  keywords: ["freelance", "facturation", "devis", "signature électronique", "gestion projet", "transfert fichiers", "petite entreprise", "auto-entrepreneur"],
  authors: [{ name: "Newbi" }],
  creator: "Newbi",
  publisher: "Newbi",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'https://newbi.fr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Newbi - Solution complète pour freelances et petites entreprises",
    description: "Simplifiez votre activité avec Newbi : devis, factures, signatures électroniques, transferts de fichiers et gestion de projets.",
    url: '/',
    siteName: 'Newbi',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/op-newbi.png',
        width: 1200,
        height: 630,
        alt: 'Newbi - Solution complète pour freelances',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Newbi - Solution complète pour freelances et petites entreprises",
    description: "Simplifiez votre activité avec Newbi : devis, factures, signatures électroniques, transferts de fichiers et gestion de projets.",
    images: ['/images/op-newbi.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/newbi.svg",
    shortcut: "/newbi.svg",
    apple: "/newbi.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning translate="no">
      <head>
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
        <ApolloWrapper>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            {children}
            <CookieManager />
          </ThemeProvider>
        </ApolloWrapper>
        <Toaster />
      </body>
    </html>
  );
}
