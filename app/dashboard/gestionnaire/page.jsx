import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import {
  findActiveAccountManagerByUserId,
  listManagedClients,
} from "@/src/lib/managed-clients";
import ManagedClientsView from "@/src/components/gestionnaire/managed-clients-view";

export const dynamic = "force-dynamic";

export default async function GestionnaireClientsPage() {
  // Accès vérifié par le layout ; relu ici pour charger les clients
  const session = await auth.api.getSession({ headers: await headers() });
  const manager = await findActiveAccountManagerByUserId(
    mongoDb,
    session.user.id,
  );
  const clients = await listManagedClients(mongoDb, manager._id);

  return (
    <ManagedClientsView
      managerName={manager.name}
      clients={JSON.parse(JSON.stringify(clients))}
    />
  );
}
