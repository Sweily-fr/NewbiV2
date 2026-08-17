import { InvoiceEditorSkeleton } from "../../../components/invoice-editor-skeleton";

// Affiché par Next pendant le chargement de la route : l'éditeur d'avoir a la
// même structure plein écran que l'éditeur de facture, on réutilise son skeleton.
export default function Loading() {
  return <InvoiceEditorSkeleton />;
}
