import { DeliveryNoteEditorSkeleton } from "../../components/delivery-note-editor-skeleton";

// Sans ce fichier, la route hérite du skeleton de LISTE de bons-de-livraison/loading.jsx.
export default function Loading() {
  return <DeliveryNoteEditorSkeleton />;
}
