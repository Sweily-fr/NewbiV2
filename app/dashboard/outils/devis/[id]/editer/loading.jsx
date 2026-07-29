import { QuoteEditorSkeleton } from "../../components/quote-editor-skeleton";

// Affiché par Next pendant le chargement de la route : sans ce fichier, la
// route hérite du skeleton de LISTE défini dans devis/loading.jsx.
export default function Loading() {
  return <QuoteEditorSkeleton />;
}
