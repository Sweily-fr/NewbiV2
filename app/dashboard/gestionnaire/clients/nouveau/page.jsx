import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewManagedClientForm from "@/src/components/gestionnaire/new-managed-client-form";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

export default function NewManagedClientPage() {
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
        <h1 className="text-2xl font-medium mt-3 mb-0">Nouveau client</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Créez l&apos;espace Newbi d&apos;une entreprise que vous accompagnez.
        </p>
      </div>
      <section className="max-w-2xl rounded-lg border border-border bg-background p-5">
        <NewManagedClientForm />
      </section>
    </div>
  );
}
