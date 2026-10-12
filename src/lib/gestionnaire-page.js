import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { findActiveAccountManagerByUserId } from "@/src/lib/managed-clients";

/**
 * Pages de l'espace gestionnaire : session et compte gestionnaire actif,
 * sinon retour à l'accueil du tableau de bord.
 *
 * Appelé par le layout ET par chaque page : Next rend le layout et la page
 * en parallèle, la page ne peut donc pas compter sur la redirection du
 * layout (sans ce contrôle, un compte non gestionnaire faisait planter la
 * page côté serveur avant d'être redirigé).
 * @returns {Promise<{ session: object, manager: object }>}
 */
export async function requireManagerPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const manager = session?.user
    ? await findActiveAccountManagerByUserId(mongoDb, session.user.id)
    : null;
  if (!manager) redirect("/dashboard");
  return { session, manager };
}
