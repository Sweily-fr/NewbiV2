"use client";

import { useFormContext } from "react-hook-form";
import ClientSelector from "@/app/dashboard/outils/devis/components/quote-form-sections/client-selector";
import { addressFromClient } from "../../hooks/use-delivery-note-editor";

/**
 * Sélection du client (réutilise le sélecteur des devis / factures).
 * À la sélection, l'adresse de livraison reprend celle du client tant que
 * l'utilisateur n'a pas saisi une adresse différente.
 */
export default function ClientSection({
  canEdit,
  validationErrors = {},
  setValidationErrors,
  onEditClient,
}) {
  const { watch, setValue, getValues } = useFormContext();
  const client = watch("client");
  const clientPositionRight = watch("clientPositionRight");

  const handleSelect = (selected) => {
    setValue("client", selected, { shouldDirty: true, shouldValidate: true });
    if (getValues("useClientAddress")) {
      setValue("deliveryAddress", addressFromClient(selected), {
        shouldDirty: true,
      });
    }
    if (validationErrors?.client && setValidationErrors) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.client;
        return next;
      });
    }
  };

  return (
    <div data-error-field="client">
      <h3 className="font-medium text-lg">Sélection d'un client</h3>
      <ClientSelector
        selectedClient={client}
        onSelect={handleSelect}
        disabled={!canEdit}
        className="p-0"
        error={
          validationErrors?.client
            ? validationErrors.client.message || validationErrors.client
            : null
        }
        setValidationErrors={setValidationErrors}
        clientPositionRight={clientPositionRight || false}
        onClientPositionChange={(checked) =>
          setValue("clientPositionRight", checked, { shouldDirty: true })
        }
        onEditClient={onEditClient}
      />
    </div>
  );
}
