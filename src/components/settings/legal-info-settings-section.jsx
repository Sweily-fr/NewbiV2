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
import { LegalInfoDialog } from "@/src/components/legal-info-dialog";

/**
 * Les informations légales appartiennent à l'organisation et non au document :
 * elles sont éditées dans une modale qui les enregistre immédiatement, comme
 * les informations entreprise et les coordonnées bancaires. Elles vivent dans
 * companyInfo (pas de champs plats) : l'écouteur les répercute directement
 * pour que le pied de page de l'aperçu suive sans recharger.
 */
export default function LegalInfoSettingsSection({ organization }) {
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
  // d'enregistrer. L'événement est aussi émis par CompanyInfoDialog et
  // BankDetailsDialog, d'où le test sur la présence d'un champ légal.
  useEffect(() => {
    const handleOrganizationUpdated = (event) => {
      const detail = event.detail || {};
      if (detail.siret === undefined && detail.vatMode === undefined) return;

      setOrgOverride((prev) => ({ ...prev, ...detail }));

      // shouldDirty: false — c'est déjà enregistré côté organisation, le
      // panneau ne doit pas réclamer un "Appliquer" pour autant.
      const opts = { shouldDirty: false };
      if (detail.siret !== undefined) {
        setValue("companyInfo.siret", detail.siret, opts);
      }
      if (detail.siren !== undefined) {
        setValue("companyInfo.siren", detail.siren, opts);
      }
      if (detail.rcs !== undefined) {
        setValue("companyInfo.rcs", detail.rcs, opts);
      }
      if (detail.capitalSocial !== undefined) {
        setValue("companyInfo.capitalSocial", detail.capitalSocial, opts);
      }
      if (detail.vatNumber !== undefined) {
        setValue("companyInfo.vatNumber", detail.vatNumber, opts);
      }
      if (detail.legalForm !== undefined) {
        // Le pied de page lit legalForm, le reste du document companyStatus.
        setValue("companyInfo.legalForm", detail.legalForm, opts);
        setValue("companyInfo.companyStatus", detail.legalForm, opts);
      }
      if (detail.vatMode !== undefined) {
        setValue("companyInfo.vatPaymentCondition", detail.vatMode, opts);
      }
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
    <Card className="shadow-none border-none bg-transparent p-0 py-0!">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 font-medium text-lg">
          Informations légales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="text-sm text-muted-foreground p-3 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
          <p className="mb-2">
            Votre forme juridique, votre capital social, votre SIRET, votre RCS,
            votre numéro de TVA et votre régime de TVA sont communs à tous vos
            documents.
          </p>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-medium flex items-center gap-1 underline"
            onClick={() => setShowDialog(true)}
          >
            <Settings className="h-4 w-4" />
            Modifier vos informations légales
          </Button>
        </div>
      </CardContent>

      <LegalInfoDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        organization={currentOrganization}
      />
    </Card>
  );
}
