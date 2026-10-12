import { requireManagerPage } from "@/src/lib/gestionnaire-page";

export const metadata = {
  title: "Espace gestionnaire | Newbi",
  robots: { index: false, follow: false },
};

/**
 * Espace gestionnaire, dans le tableau de bord (même interface, menu
 * adapté) : réservé aux utilisateurs qui ont un compte gestionnaire actif,
 * créé par Newbi depuis newbi-admin. Les autres retournent à l'accueil.
 */
export default async function GestionnaireLayout({ children }) {
  await requireManagerPage();
  return children;
}
