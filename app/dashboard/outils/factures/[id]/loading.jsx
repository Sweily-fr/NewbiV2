import { InvoiceDetailsSkeleton } from "../components/invoice-editor-skeleton";

// Affiché par Next pendant le chargement de la route : sans ce fichier, la
// route hérite du skeleton de LISTE défini dans factures/loading.jsx.
export default function Loading() {
  return <InvoiceDetailsSkeleton />;
}
