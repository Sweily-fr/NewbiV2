import Link from "next/link";
import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import {
  findActiveAccountManagerByUserId,
  listManagedClients,
} from "@/src/lib/managed-clients";
import { buttonVariants } from "@/src/components/ui/button";
import ManagedClientsTable from "@/src/components/gestionnaire/managed-clients-table";

export const dynamic = "force-dynamic";

export default async function GestionnaireClientsPage() {
  // Accès vérifié par le layout ; relu ici pour charger les clients
  const session = await auth.api.getSession({ headers: await headers() });
  const manager = await findActiveAccountManagerByUserId(
    mongoDb,
    session.user.id,
  );
  const clients = await listManagedClients(mongoDb, manager._id);
  const active = clients.filter((c) => c.status === "active");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">
            Mes clients
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
              {active.length}
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ouvrez le dossier d&apos;un client pour travailler dans son espace.
          </p>
        </div>
        <Link
          href="/gestionnaire/clients/nouveau"
          className={buttonVariants({ variant: "primary" })}
        >
          <Plus className="size-4" />
          Nouveau client
        </Link>
      </div>

      <ManagedClientsTable clients={JSON.parse(JSON.stringify(clients))} />
    </div>
  );
}
