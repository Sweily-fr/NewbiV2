"use client";

import { useFormContext } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { CountrySearchSelect } from "@/src/components/ui/country-search-select";
import { addressFromClient } from "../../hooks/use-delivery-note-editor";

const LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

/**
 * Adresse de livraison : par défaut celle du client (adresse de livraison
 * distincte de sa fiche si renseignée, sinon son adresse principale), ou une
 * adresse propre à ce bon de livraison.
 */
export default function DeliveryAddressSection({
  canEdit,
  validationErrors = {},
}) {
  const { watch, setValue } = useFormContext();
  const client = watch("client");
  const useClientAddress = watch("useClientAddress");
  const address = watch("deliveryAddress") || {};

  const clientAddress = addressFromClient(client);
  const shown = useClientAddress ? clientAddress : address;

  const update = (field, value) => {
    setValue(
      "deliveryAddress",
      { ...(watch("deliveryAddress") || {}), [field]: value },
      { shouldDirty: true },
    );
  };

  return (
    <div className="space-y-4" data-error-field="deliveryAddress">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Adresse de livraison
        </h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!useClientAddress}
            disabled={!canEdit || !client}
            onCheckedChange={(checked) => {
              const next = !!checked;
              setValue("useClientAddress", next, { shouldDirty: true });
              if (next) {
                setValue("deliveryAddress", clientAddress, {
                  shouldDirty: true,
                });
              }
            }}
          />
          Utiliser l'adresse du client
        </label>
      </div>

      {useClientAddress ? (
        <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
          {client ? (
            shown.street || shown.city ? (
              <div className="space-y-0.5">
                {shown.fullName && (
                  <p className="font-medium">{shown.fullName}</p>
                )}
                {shown.street && <p>{shown.street}</p>}
                <p>
                  {shown.postalCode} {shown.city}
                </p>
                {shown.country && (
                  <p className="text-muted-foreground">{shown.country}</p>
                )}
                {client.hasDifferentShippingAddress && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Adresse de livraison de la fiche client
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Ce client n'a pas d'adresse renseignée : décochez pour saisir
                une adresse de livraison.
              </p>
            )
          ) : (
            <p className="text-muted-foreground">
              Sélectionnez un client pour reprendre son adresse.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label className={LABEL_CLASS}>Destinataire</Label>
            <Input
              value={address.fullName || ""}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Nom du destinataire ou du site"
              disabled={!canEdit}
              maxLength={100}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className={LABEL_CLASS}>
              Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              value={address.street || ""}
              onChange={(e) => update("street", e.target.value)}
              placeholder="Numéro et rue"
              disabled={!canEdit}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>
              Code postal <span className="text-red-500">*</span>
            </Label>
            <Input
              value={address.postalCode || ""}
              onChange={(e) => update("postalCode", e.target.value)}
              placeholder="75001"
              disabled={!canEdit}
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>
              Ville <span className="text-red-500">*</span>
            </Label>
            <Input
              value={address.city || ""}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Paris"
              disabled={!canEdit}
              maxLength={50}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className={LABEL_CLASS}>Pays</Label>
            <CountrySearchSelect
              value={address.country || "France"}
              onChange={(value) => update("country", value)}
              disabled={!canEdit}
            />
          </div>
        </div>
      )}

      {validationErrors?.deliveryAddress && (
        <p className="text-xs text-destructive">
          {validationErrors.deliveryAddress}
        </p>
      )}
    </div>
  );
}
