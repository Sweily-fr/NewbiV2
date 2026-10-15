import { generateNextMetadata } from "@/src/utils/seo-data";

// La page est un composant client ("use client") : elle ne peut pas exporter
// `metadata`. Sans ce layout, elle servait le titre de l'accueil et, par
// héritage du layout racine, l'accueil comme canonique (constaté le 15/10/2026).
export const metadata = generateNextMetadata("supprimerCompte");

export default function SupprimerCompteLayout({ children }) {
  return children;
}
