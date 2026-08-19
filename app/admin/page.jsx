import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/src/lib/auth";
import { isBackofficeAdmin } from "@/src/lib/security/require-backoffice-admin";
import BackofficeClient from "./backoffice-client";

export const metadata = {
  title: "Back-office - Newbi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Mini back-office interne : gestion et purge totale des utilisateurs de
 * test. Invisible (404) pour quiconque n'est pas dans l'allowlist
 * BACKOFFICE_ADMIN_USER_IDS.
 */
export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || !isBackofficeAdmin(session.user.id)) {
    notFound();
  }

  return <BackofficeClient adminEmail={session.user.email} />;
}
