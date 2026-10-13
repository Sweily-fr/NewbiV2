import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { getClientInvitation } from "@/src/lib/managed-client-invitations";
import ManagedClientInvitationView from "@/src/components/gestionnaire/managed-client-invitation-view";

export const metadata = {
  title: "Invitation d'un cabinet | Newbi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Invitation d'un cabinet (gestionnaire) vue par le client : lien de
 * l'e-mail et bouton « Voir » du panneau Notifications > Invitations.
 */
export default async function ManagedClientInvitationPage({ params }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(`/invitation-gestionnaire/${id}`)}`,
    );
  }

  let invitation = null;
  try {
    invitation = await getClientInvitation(mongoDb, { id, user: session.user });
  } catch {
    // Introuvable ou adressée à un autre compte : même message
  }

  return (
    <ManagedClientInvitationView
      invitation={invitation ? JSON.parse(JSON.stringify(invitation)) : null}
      userEmail={session.user.email}
    />
  );
}
