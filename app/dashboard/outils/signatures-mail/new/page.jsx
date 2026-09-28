import { redirect } from "next/navigation";

// Ancienne route de création : la liste porte désormais le bouton
// « Nouvelle signature », qui crée puis ouvre l'éditeur.
export default function LegacyNewSignaturePage() {
  redirect("/dashboard/outils/signatures-mail");
}
