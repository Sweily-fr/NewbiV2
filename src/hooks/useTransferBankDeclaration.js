import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import { DECLARE_TRANSFER_BANK_PAYMENT } from "@/src/graphql/mutations/stripe";
import { toast } from "@/src/components/ui/sonner";

export const BANK_DECLARATION_ERROR =
  "Impossible d'enregistrer votre virement. Réessayez.";
export const BANK_DECLARATION_CANCEL_ERROR =
  "Impossible de revenir au choix du paiement. Réessayez.";

/**
 * Virement d'un transfert payant annoncé par son destinataire (page publique
 * du lien) : « J'ai fait le virement », avec une adresse facultative pour
 * recevoir le lien au déblocage, ou retrait de l'annonce (« Je n'ai pas
 * encore fait le virement »).
 *
 * La réponse met à jour le transfert en cache (affichage immédiat), puis
 * `onChange` relit la page. Les fonctions rendent la réponse de l'API, ou
 * null après avoir affiché l'erreur.
 */
export function useTransferBankDeclaration({
  transferId,
  accessKey,
  onChange,
} = {}) {
  const [declareMutation] = useMutation(DECLARE_TRANSFER_BANK_PAYMENT);

  const submit = useCallback(
    async ({ email = null, cancel = false } = {}) => {
      const fallback = cancel
        ? BANK_DECLARATION_CANCEL_ERROR
        : BANK_DECLARATION_ERROR;
      if (!transferId || !accessKey) {
        toast.error(fallback);
        return null;
      }
      const variables = cancel
        ? { transferId, accessKey, cancel: true }
        : { transferId, accessKey, email: email || null };

      let response = null;
      try {
        const { data } = await declareMutation({
          variables,
          // Transfert en cache à jour dès la réponse : la page bascule sans
          // attendre sa relecture
          update: (cache, { data: result }) => {
            const declaration = result?.declareTransferBankPayment;
            if (!declaration?.success) return;
            cache.modify({
              id: cache.identify({
                __typename: "FileTransfer",
                id: transferId,
              }),
              fields: {
                bankTransferDeclaredAt: () =>
                  cancel
                    ? null
                    : declaration.declaredAt || new Date().toISOString(),
                // Après un retrait de l'annonce, l'adresse est relue avec la
                // page
                notifyEmailHint: (existing) =>
                  cancel || declaration.notifyEmailHint === undefined
                    ? existing
                    : declaration.notifyEmailHint,
              },
            });
          },
        });
        response = data?.declareTransferBankPayment || null;
      } catch {
        // Réseau ou erreur GraphQL : message générique ci-dessous
      }
      if (!response?.success) {
        toast.error(response?.message || fallback);
        return null;
      }
      // Relecture de la page en arrière-plan (état à jour côté API)
      Promise.resolve()
        .then(() => onChange?.(response))
        .catch(() => {});
      return response;
    },
    [declareMutation, transferId, accessKey, onChange],
  );

  const declareBankTransfer = useCallback(
    (email) => submit({ email }),
    [submit],
  );
  const cancelBankTransferDeclaration = useCallback(
    () => submit({ cancel: true }),
    [submit],
  );

  return { declareBankTransfer, cancelBankTransferDeclaration };
}

export default useTransferBankDeclaration;
