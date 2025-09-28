import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import { ApolloWrapper } from "@/src/providers/apollo-provider";
import { Toaster } from "@/src/components/ui/sonner";
import { SubscriptionProvider } from "@/src/contexts/subscription-context";
import CookieManager from "@/src/components/cookies/CookieManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://newbi.fr'),
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
        url: '/NewbiLogo.svg',
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
    images: ['/NewbiLogo.svg'],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloWrapper>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <SubscriptionProvider>
              {children}
              <CookieManager />
            </SubscriptionProvider>
          </ThemeProvider>
        </ApolloWrapper>
        <Toaster />
      </body>
    </html>
  );
}
