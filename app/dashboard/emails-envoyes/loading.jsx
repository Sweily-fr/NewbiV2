import { EmailSentPageSkeleton } from "./components/email-sent-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page d'un e-mail
// envoyé (au lieu du skeleton générique du tableau de bord).
export default function EmailsEnvoyesLoading() {
  return <EmailSentPageSkeleton />;
}
