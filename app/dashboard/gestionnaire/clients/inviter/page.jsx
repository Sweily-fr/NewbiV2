import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InviteManagedClientForm from "@/src/components/gestionnaire/invite-managed-client-form";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

export default async function InviteManagedClientPage({ searchParams }) {
  const params = await searchParams;
  const email = typeof params?.email === "string" ? params.email : "";
  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-10">
      <div>
        <Link
          href={GESTIONNAIRE_PATH}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Clients
        </Link>
        <h1 className="text-2xl font-medium mt-3 mb-0">Inviter un client</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pour une entreprise qui utilise déjà Newbi : elle accepte de vous
          confier son espace.
        </p>
      </div>
      <section className="max-w-xl rounded-lg border border-border bg-background p-5">
        <InviteManagedClientForm defaultEmail={email} />
      </section>
    </div>
  );
}
