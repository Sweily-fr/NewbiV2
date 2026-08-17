import { PurchaseOrderEditorSkeleton } from "../components/purchase-order-editor-skeleton";

// Affiché par Next pendant le chargement de la route : sans ce fichier, la
// route hérite du skeleton de LISTE défini dans bons-commande/loading.jsx.
export default function Loading() {
  return <PurchaseOrderEditorSkeleton />;
}
