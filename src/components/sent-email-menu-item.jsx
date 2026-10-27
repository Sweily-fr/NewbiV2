"use client";

import { useApolloClient } from "@apollo/client";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { DropdownMenuItem } from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/sonner";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { GET_DOCUMENT_EMAIL_LOGS } from "@/src/graphql/documentEmailQueries";

/**
 * « Voir l'e-mail envoyé » du menu d'actions d'une ligne : ouvre le dernier
 * envoi du document tel que le client l'a reçu. Proposé seulement pour un
 * envoi journalisé : deliveryStatus n'existe que depuis l'historique des
 * envois, un envoi plus ancien n'a pas d'aperçu.
 */
export function SentEmailMenuItem({ documentType, document }) {
  const router = useRouter();
  const client = useApolloClient();
  const { workspaceId } = useRequiredWorkspace();

  if (!document?.emailTracking?.deliveryStatus) return null;

  const openLastEmail = async () => {
    try {
      const { data } = await client.query({
        query: GET_DOCUMENT_EMAIL_LOGS,
        variables: { workspaceId, documentType, documentId: document.id },
        // Un renvoi récent doit ouvrir le nouvel e-mail
        fetchPolicy: "network-only",
      });
      const lastLog = data?.documentEmailLogs?.[0];
      if (!lastLog) {
        toast.error("Aucun aperçu disponible pour cet envoi");
        return;
      }
      router.push(`/dashboard/emails-envoyes/${lastLog.id}`);
    } catch {
      toast.error("Impossible d'ouvrir l'e-mail envoyé");
    }
  };

  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        openLastEmail();
      }}
    >
      <MailCheck className="mr-2 h-4 w-4" />
      Voir l&apos;e-mail envoyé
    </DropdownMenuItem>
  );
}
