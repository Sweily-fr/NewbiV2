import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { findActiveAccountManagerByUserId } from "@/src/lib/managed-clients";
import GestionnaireShell from "@/src/components/gestionnaire/gestionnaire-shell";

export const metadata = {
  title: "Espace gestionnaire | Newbi",
  robots: { index: false, follow: false },
};

/**
 * Espace gestionnaire : réservé aux utilisateurs qui ont un compte
 * gestionnaire actif (créé par Newbi depuis newbi-admin). Les autres sont
 * renvoyés vers leur tableau de bord.
 */
export default async function GestionnaireLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=%2Fgestionnaire");
  }

  const manager = await findActiveAccountManagerByUserId(
    mongoDb,
    session.user.id,
  );
  if (!manager) {
    redirect("/dashboard");
  }

  return (
    <GestionnaireShell
      managerName={manager.name}
      userEmail={session.user.email}
    >
      {children}
    </GestionnaireShell>
  );
}
