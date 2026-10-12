import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewManagedClientForm from "@/src/components/gestionnaire/new-managed-client-form";

export default function NewManagedClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/gestionnaire"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Mes clients
      </Link>
      <div>
        <h1 className="text-xl font-medium tracking-tight">Nouveau client</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Créez l&apos;espace Newbi d&apos;une entreprise que vous accompagnez.
        </p>
      </div>
      <section className="max-w-2xl rounded-lg border border-border bg-background p-5">
        <NewManagedClientForm />
      </section>
    </div>
  );
}
