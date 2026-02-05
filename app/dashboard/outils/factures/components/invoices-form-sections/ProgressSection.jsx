"use client";

import { useFormContext } from "react-hook-form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useLazyQuery } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { GET_SITUATION_INVOICES_BY_QUOTE_REF } from "@/src/graphql/invoiceQueries";

export default function ProgressSection({ canEdit = true }) {
  const { watch, setValue, getValues } = useFormContext();
  const { workspaceId } = useRequiredWorkspace();

  const invoiceType = watch("invoiceType");
  const items = watch("items") || [];
  const progressMode = watch("progressMode") || "uniform";
  const globalProgress = watch("globalProgressPercentage") ?? 100;
  const situationReference = watch("situationReference");
  const currentInvoiceId = watch("id"); // ID de la facture en cours d'édition

  // État pour stocker l'avancement cumulé des factures précédentes
  const [previousProgress, setPreviousProgress] = useState(0);
  const [previousInvoicesCount, setPreviousInvoicesCount] = useState(0);

  // Ref pour éviter les modifications de données au montage initial
  const isInitialMountRef = useRef(true);

  // Requête pour récupérer les factures de situation précédentes
  const [fetchPreviousInvoices, { data: previousInvoicesData }] = useLazyQuery(
    GET_SITUATION_INVOICES_BY_QUOTE_REF,
    {
      fetchPolicy: "network-only",
    }
  );

  // Récupérer les factures précédentes quand la référence de situation change
  useEffect(() => {
    if (situationReference && workspaceId && invoiceType === "situation") {
      fetchPreviousInvoices({
        variables: {
          workspaceId: workspaceId,
          purchaseOrderNumber: situationReference,
        },
      });
    }
  }, [situationReference, workspaceId, invoiceType, fetchPreviousInvoices]);

  // Calculer l'avancement cumulé des factures précédentes
  useEffect(() => {
    if (previousInvoicesData?.situationInvoicesByQuoteRef) {
      const invoices = previousInvoicesData.situationInvoicesByQuoteRef;

      // Filtrer pour exclure la facture en cours d'édition
      const otherInvoices = invoices.filter(
        (inv) => inv.id !== currentInvoiceId
      );

      setPreviousInvoicesCount(otherInvoices.length);

      if (otherInvoices.length === 0) {
        setPreviousProgress(0);
        return;
      }

      // Calculer l'avancement cumulé (moyenne pondérée des progressPercentage des articles)
      let totalProgress = 0;
      otherInvoices.forEach((invoice) => {
        if (invoice.items && invoice.items.length > 0) {
          // Prendre le progressPercentage moyen des articles de cette facture
          const avgProgress =
            invoice.items.reduce((sum, item) => {
              return sum + (item.progressPercentage || 0);
            }, 0) / invoice.items.length;
          totalProgress += avgProgress;
        }
      });

      setPreviousProgress(Math.min(totalProgress, 100));

      // Le pré-remplissage du pourcentage restant est géré par InvoiceInfoSection
      // au moment de la liaison (pas au montage de ce composant)
    }
  }, [previousInvoicesData, currentInvoiceId]);

  // Ne pas afficher si ce n'est pas une facture de situation
  if (invoiceType !== "situation") {
    return null;
  }

  // Calculer le solde à facturer
  const remainingPercentage = Math.max(0, 100 - previousProgress);

  // Vérifier si l'avancement dépasse 100%
  const currentTotalProgress = previousProgress + globalProgress;
  const isOverLimit = currentTotalProgress > 100;
  const totalProgress = currentTotalProgress;

  // Appliquer le pourcentage global à tous les articles
  const applyGlobalProgress = (value) => {
    let sanitizedValue = value.replace(/,/g, ".");
    sanitizedValue = sanitizedValue.replace(/[^\d.]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }

    let numValue = parseFloat(sanitizedValue);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    if (numValue > 100) numValue = 100;

    setValue("globalProgressPercentage", numValue, { shouldDirty: true });

    // Appliquer à tous les articles si mode uniforme
    if (progressMode === "uniform") {
      const currentItems = getValues("items") || [];
      currentItems.forEach((_, index) => {
        setValue(`items.${index}.progressPercentage`, numValue, {
          shouldDirty: true,
        });
      });
    }
  };

  // Appliquer le pourcentage à un article individuel
  const applyItemProgress = (index, value) => {
    let sanitizedValue = value.replace(/,/g, ".");
    sanitizedValue = sanitizedValue.replace(/[^\d.]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }

    let numValue = parseFloat(sanitizedValue);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    if (numValue > 100) numValue = 100;

    setValue(`items.${index}.progressPercentage`, numValue, {
      shouldDirty: true,
    });
  };

  // Gérer le changement de mode
  const handleModeChange = (newMode) => {
    setValue("progressMode", newMode, { shouldDirty: true });

    if (newMode === "uniform") {
      // Appliquer le pourcentage global à tous les articles
      const currentItems = getValues("items") || [];
      const currentGlobalProgress =
        getValues("globalProgressPercentage") ?? 100;
      currentItems.forEach((_, index) => {
        setValue(`items.${index}.progressPercentage`, currentGlobalProgress, {
          shouldDirty: true,
        });
      });
    }
  };

  // Synchroniser le pourcentage global avec les articles quand le mode change
  // (pas au montage initial pour éviter de modifier les calculs au changement d'étape)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (invoiceType !== "situation") return;
    if (progressMode === "uniform" && items.length > 0) {
      const currentGlobalProgress =
        getValues("globalProgressPercentage") ?? 100;
      items.forEach((_, index) => {
        const currentItemProgress = getValues(
          `items.${index}.progressPercentage`
        );
        if (currentItemProgress !== currentGlobalProgress) {
          setValue(`items.${index}.progressPercentage`, currentGlobalProgress, {
            shouldDirty: true,
          });
        }
      });
    }
  }, [progressMode, items.length, invoiceType]);

  return (
    <Card className="border-0 shadow-none bg-transparent mb-0 mt-8 p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-normal text-lg">
          Facturation partielle
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Indiquez le pourcentage du montant total à facturer pour cette
          situation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Radio buttons pour le mode */}
        <RadioGroup
          value={progressMode}
          onValueChange={handleModeChange}
          disabled={!canEdit}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="uniform" id="uniform" />
            <Label htmlFor="uniform" className="font-normal cursor-pointer">
              Identique pour tous les articles
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="font-normal cursor-pointer">
              Différente pour chaque article
            </Label>
          </div>
        </RadioGroup>

        {/* Alerte si l'avancement dépasse 100% */}
        {isOverLimit && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Attention :</span> L'avancement
              cumulé (
              {totalProgress
                .toFixed(2)
                .replace(/\.00$/, "")
                .replace(/(\.\d)0$/, "$1")}
              %) dépasse 100%.
              {previousInvoicesCount > 0 && (
                <span>
                  {" "}
                  Les {previousInvoicesCount} facture(s) précédente(s)
                  représentent déjà{" "}
                  {previousProgress.toFixed(2).replace(/\.00$/, "")}%
                  d'avancement.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Champ de pourcentage global (visible uniquement en mode uniforme) */}
        {progressMode === "uniform" && (
          <div
            className={`border rounded-lg p-4 space-y-4 ${isOverLimit ? "border-amber-300" : ""}`}
          >
            {/* Avancement cumulé des factures précédentes */}
            {previousInvoicesCount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Avancement cumulé ({previousInvoicesCount} facture
                  {previousInvoicesCount > 1 ? "s" : ""} précédente
                  {previousInvoicesCount > 1 ? "s" : ""})
                </span>
                <span className="font-medium">
                  {previousProgress
                    .toFixed(2)
                    .replace(/\.00$/, "")
                    .replace(/(\.\d)0$/, "$1")}
                  %
                </span>
              </div>
            )}

            {/* Solde à facturer */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Solde à facturer</span>
              <span className="font-medium">
                {remainingPercentage
                  .toFixed(2)
                  .replace(/\.00$/, "")
                  .replace(/(\.\d)0$/, "$1")}
                %
              </span>
            </div>

            {/* Champ pourcentage à facturer */}
            <div className="space-y-2">
              <Label className="text-sm font-normal">
                Pourcentage à facturer
              </Label>
              <div className="relative flex rounded-md shadow-xs">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={globalProgress}
                  onChange={(e) => applyGlobalProgress(e.target.value)}
                  disabled={!canEdit}
                  className={`-me-px rounded-e-none shadow-none h-10 text-sm w-full ${isOverLimit ? "border-amber-300 focus:border-amber-400" : ""}`}
                />
                <span className="-z-10 inline-flex items-center rounded-e-md border border-input bg-background px-3 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Liste des articles en mode individuel */}
        {progressMode === "individual" && (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Ajoutez des articles pour définir leur pourcentage de
                facturation individuellement.
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  {/* Nom de l'article */}
                  <div className="font-medium text-sm">
                    {item.description || `Élément ${index + 1}`}
                  </div>

                  {/* Solde à facturer */}
                  <div className="text-sm text-muted-foreground">
                    Solde à facturer: {remainingPercentage}%
                  </div>

                  {/* Champ pourcentage à facturer */}
                  <div className="space-y-1">
                    <Label className="text-sm font-normal">
                      Pourcentage à facturer
                    </Label>
                    <div className="relative flex rounded-md shadow-xs">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          watch(`items.${index}.progressPercentage`) ?? 100
                        }
                        onChange={(e) =>
                          applyItemProgress(index, e.target.value)
                        }
                        disabled={!canEdit}
                        className="-me-px rounded-e-none shadow-none h-10 text-sm w-full"
                      />
                      <span className="-z-10 inline-flex items-center rounded-e-md border border-input bg-background px-3 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
