import { mongoDb } from "@/src/lib/mongodb";
import { requireManagerPage } from "@/src/lib/gestionnaire-page";
import {
  listManagedDocuments,
  MANAGED_DOCUMENT_KINDS,
} from "@/src/lib/managed-documents";
import ManagedDocumentsView from "./managed-documents-view";

const PAGES = {
  invoices: {
    title: "Factures clients",
    dueLabel: "Échéance",
    emptyLabel: "Aucune facture chez vos clients pour l'instant.",
  },
  quotes: {
    title: "Devis",
    dueLabel: "Validité",
    emptyLabel: "Aucun devis chez vos clients pour l'instant.",
  },
  purchaseOrders: {
    title: "Bons de commande",
    dueLabel: "Livraison",
    emptyLabel: "Aucun bon de commande chez vos clients pour l'instant.",
  },
  deliveryNotes: {
    title: "Bons de livraison",
    dueLabel: "Livraison",
    emptyLabel: "Aucun bon de livraison chez vos clients pour l'instant.",
  },
  creditNotes: {
    title: "Avoirs",
    dueLabel: "Facture d'origine",
    emptyLabel: "Aucun avoir chez vos clients pour l'instant.",
  },
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
      emptyLabel={PAGES[kind].emptyLabel}
      badgeType={config.badgeType}
      openPath={config.openPath}
      showTotal={config.showTotal !== false}
      tabs={config.tabs}
      data={JSON.parse(JSON.stringify(data))}
      current={current}
    />
  );
}
