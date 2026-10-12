import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { findActiveAccountManagerByUserId } from "@/src/lib/managed-clients";

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
  const session = await auth.api.getSession({ headers: await headers() });
  const manager = session?.user
    ? await findActiveAccountManagerByUserId(mongoDb, session.user.id)
    : null;
  if (!manager) {
    redirect("/dashboard");
  }
  return children;
}
