import { AutomationPageSkeleton } from "./components/automation-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page Intégrations.
// Réutilise le skeleton fidèle à la page pour que la transition soit
// invisible (pas de doublon de loader).
export default function AutomationLoading() {
  return <AutomationPageSkeleton />;
}
