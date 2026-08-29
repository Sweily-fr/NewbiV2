import { redirect } from "next/navigation";

// Ancienne page produit : la synchronisation bancaire est présentée sur la
// page trésorerie. Rediriger vers l'accueil faisait perdre le contexte
// (et l'autorité SEO) de l'URL.
export default function SynchronisationBancairePage() {
  redirect("/produits/tresorerie");
}
