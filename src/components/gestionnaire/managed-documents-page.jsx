import { mongoDb } from "@/src/lib/mongodb";
import { requireManagerPage } from "@/src/lib/gestionnaire-page";
import {
  listManagedDocuments,
  MANAGED_DOCUMENT_KINDS,
} from "@/src/lib/managed-documents";
import ManagedDocumentsView from "./managed-documents-view";

const PAGES = {
  invoices: { title: "Factures clients", dueLabel: "Échéance" },
  quotes: { title: "Devis", dueLabel: "Validité" },
  purchaseOrders: { title: "Bons de commande", dueLabel: "Livraison" },
};

const one = (value) => (Array.isArray(value) ? value[0] : value);

/**
 * Page serveur commune aux listes de l'espace gestionnaire (factures,
 * devis, bons de commande de tous les dossiers clients).
 */
export default async function ManagedDocumentsPage({ kind, searchParams }) {
  const params = await searchParams;
  const { session, manager } = await requireManagerPage();

  const current = {
    status: String(one(params?.statut) || "all"),
    organizationId: String(one(params?.dossier) || ""),
    q: String(one(params?.q) || ""),
    page: Number(one(params?.page)) || 1,
  };

  const data = await listManagedDocuments(mongoDb, {
    managerId: manager._id,
    userId: session.user.id,
    kind,
    status: current.status,
    organizationId: current.organizationId || undefined,
    q: current.q,
    page: current.page,
  });

  const config = MANAGED_DOCUMENT_KINDS[kind];
  return (
    <ManagedDocumentsView
      title={PAGES[kind].title}
      dueLabel={PAGES[kind].dueLabel}
      badgeType={config.badgeType}
      openPath={config.openPath}
      tabs={config.tabs}
      data={JSON.parse(JSON.stringify(data))}
      current={current}
    />
  );
}
