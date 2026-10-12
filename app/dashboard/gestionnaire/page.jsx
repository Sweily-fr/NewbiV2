import { mongoDb } from "@/src/lib/mongodb";
import { listManagedClients } from "@/src/lib/managed-clients";
import { requireManagerPage } from "@/src/lib/gestionnaire-page";
import ManagedClientsView from "@/src/components/gestionnaire/managed-clients-view";

export const dynamic = "force-dynamic";

export default async function GestionnaireClientsPage() {
  const { manager } = await requireManagerPage();
  const clients = await listManagedClients(mongoDb, manager._id);

  return (
    <ManagedClientsView
      managerName={manager.name}
      discountPercent={manager.discountPercent ?? 0}
      clients={JSON.parse(JSON.stringify(clients))}
    />
  );
}
