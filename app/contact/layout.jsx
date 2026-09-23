import { generateNextMetadata } from "@/src/utils/seo-data";

// La page est un composant client ("use client") : elle ne peut pas exporter
// `metadata`. Sans ce layout, Next servait le titre par défaut du layout
// racine et les balises n'étaient injectées que côté client, donc invisibles
// pour Google (constaté en prod le 23/09/2026).
export const metadata = generateNextMetadata("contactPage");

export default function ContactLayout({ children }) {
  return children;
}
