"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Settings } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { CompanyInfoDialog } from "@/src/components/company-info-dialog";

// Champs du document alimentés par la modale, pour que l'aperçu suive sans
// recharger l'organisation.
const SYNCED_FIELDS = [
  "logo",
  "companyName",
  "companyEmail",
  "companyPhone",
  "website",
  "addressStreet",
  "addressCity",
  "addressZipCode",
  "addressCountry",
  "showCommercialName",
  "commercialName",
  "isRegulatedActivity",
  "professionalTitle",
  "regulatoryBody",
  "professionalNumber",
  "decennialInsurance",
  "professionalLiabilityInsurance",
];

/**
 * Les informations de l'entreprise appartiennent à l'organisation et non au
 * document : elles sont éditées dans une modale qui les enregistre
 * immédiatement, comme les coordonnées bancaires.
 */
export default function CompanyInfoSettingsSection({ organization }) {
  const { setValue } = useFormContext();
  const [showDialog, setShowDialog] = useState(false);
  // L'organisation reçue en prop est chargée une fois par l'éditeur : on garde
  // localement ce qui vient d'être enregistré pour ne pas rouvrir la modale
  // avec des valeurs périmées.
  const [orgOverride, setOrgOverride] = useState({});

  // Mémoïsé impérativement : la modale se réinitialise sur l'identité de cet
  // objet. Recréé à chaque rendu, il effacerait la saisie en cours.
  const currentOrganization = useMemo(
    () => ({ ...(organization || {}), ...orgOverride }),
    [organization, orgOverride],
  );

  // Répercuter dans le formulaire du document ce que la modale vient
  // d'enregistrer. L'événement est aussi émis par BankDetailsDialog, d'où le
  // test sur la présence d'un champ entreprise.
  useEffect(() => {
    const handleOrganizationUpdated = (event) => {
      const detail = event.detail || {};
      if (detail.companyName === undefined) return;

      setOrgOverride((prev) => ({ ...prev, ...detail }));

      SYNCED_FIELDS.forEach((field) => {
        if (detail[field] !== undefined) {
          // shouldDirty: false — c'est déjà enregistré côté organisation, le
          // panneau ne doit pas réclamer un "Appliquer" pour autant.
          setValue(field, detail[field], { shouldDirty: false });
        }
      });
    };

    window.addEventListener("organizationUpdated", handleOrganizationUpdated);
    return () => {
      window.removeEventListener(
        "organizationUpdated",
        handleOrganizationUpdated,
      );
    };
  }, [setValue]);

  return (
    <Card className="shadow-none border-none bg-transparent p-0">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Informations de l&apos;entreprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="text-sm text-muted-foreground p-3 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
          <p className="mb-2">
            Votre logo, votre dénomination, votre adresse, votre nom commercial
            et votre activité réglementée sont communs à tous vos documents.
          </p>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-medium flex items-center gap-1 underline"
            onClick={() => setShowDialog(true)}
          >
            <Settings className="h-4 w-4" />
            Modifier vos informations entreprise
          </Button>
        </div>
      </CardContent>

      <CompanyInfoDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        organization={currentOrganization}
      />
    </Card>
  );
}
