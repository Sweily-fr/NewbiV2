"use client";

import { createContext, useCallback, useContext, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Circle, CornerDownLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { cn } from "@/src/lib/utils";

// Chunk chargé à la première ouverture seulement
const SettingsModal = dynamic(
  () => import("@/src/components/settings-modal").then((m) => m.SettingsModal),
  { ssr: false },
);

/** Champs requis pour générer un document, avec leur état. */
export function getCompanyInfoFields(organization) {
  return {
    generalFields: [
      { name: "Nom de l'entreprise", completed: !!organization?.companyName },
      { name: "Email de contact", completed: !!organization?.companyEmail },
      { name: "Rue", completed: !!organization?.addressStreet },
      { name: "Ville", completed: !!organization?.addressCity },
      { name: "Code postal", completed: !!organization?.addressZipCode },
      { name: "Pays", completed: !!organization?.addressCountry },
    ],
    legalFields: [
      { name: "SIRET", completed: !!organization?.siret },
      { name: "Forme juridique", completed: !!organization?.legalForm },
    ],
  };
}

/** Onglet des paramètres où compléter le premier champ manquant. */
export function companyInfoSettingsTab(fieldsInfo) {
  return fieldsInfo.generalFields.some((f) => !f.completed)
    ? "generale"
    : "informations-legales";
}

function FieldList({ title, fields, keyPrefix }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {fields.map((field, index) => (
          <div
            key={`${keyPrefix}-${index}`}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2",
              index !== fields.length - 1 && "border-b border-border/40",
            )}
          >
            {field.completed ? (
              <div className="flex items-center justify-center size-4 rounded-full bg-foreground shrink-0">
                <Check className="size-2.5 text-background" strokeWidth={3} />
              </div>
            ) : (
              <Circle className="size-4 text-border shrink-0" strokeWidth={2} />
            )}
            <span
              className={cn(
                "text-[13px]",
                field.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {field.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Fenêtre « Configuration de votre entreprise » : champs manquants pour
 * générer un document, « Compléter » (paramètres) ou, sans le droit de
 * modifier l'espace, « Contactez l'administrateur de l'espace ».
 */
export function CompanyInfoDialog({
  open,
  onOpenChange,
  fieldsInfo,
  canEditOrgSettings,
  onCancel,
  onComplete,
}) {
  const allFields = [...fieldsInfo.generalFields, ...fieldsInfo.legalFields];
  const completedCount = allFields.filter((f) => f.completed).length;
  const totalCount = allFields.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium">
              Configuration de votre entreprise
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pt-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">
                Complétez ces informations pour générer vos documents.
              </p>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">
                {completedCount}/{totalCount}
              </span>
            </div>

            <div className="h-1 bg-muted rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-foreground rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <FieldList
                title="Général"
                fields={fieldsInfo.generalFields}
                keyPrefix="general"
              />
              <FieldList
                title="Légal"
                fields={fieldsInfo.legalFields}
                keyPrefix="legal"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/40 -mx-5 px-5 py-3">
              <button
                onClick={onCancel}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Retour
              </button>
              {canEditOrgSettings ? (
                <Button
                  variant="primary"
                  onClick={onComplete}
                  className="gap-2 cursor-pointer"
                >
                  Compléter
                  <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                    <CornerDownLeft className="size-3" />
                  </kbd>
                </Button>
              ) : (
                <span className="text-[13px] text-muted-foreground">
                  Contactez l&apos;administrateur de l&apos;espace
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CompanyInfoGateContext = createContext(null);

/**
 * Contrôle des informations d'entreprise au moment de CRÉER un document
 * depuis une liste (finaliser un brouillon, convertir en bon de livraison
 * ou en facture…) : consulter les listes ne demande rien, seule la création
 * a besoin de ces informations. Monté une fois dans le tableau de bord.
 */
export function CompanyInfoGateProvider({ children }) {
  const { organization } = useDashboardLayoutContext();
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  const canEditOrgSettings = !permissionsReady || canDo("orgSettings", "edit");
  const [fieldsInfo, setFieldsInfo] = useState(null);
  const [settingsTab, setSettingsTab] = useState(null);

  // Lance l'action si l'espace peut générer des documents, sinon ouvre la
  // fenêtre (l'utilisateur relance l'action une fois les informations
  // complétées). Espace pas encore chargé : on laisse passer.
  const ensureCompanyInfo = useCallback(
    (action) => {
      if (!organization || isCompanyInfoComplete(organization)) {
        return action();
      }
      setFieldsInfo(getCompanyInfoFields(organization));
      return undefined;
    },
    [organization],
  );

  return (
    <CompanyInfoGateContext.Provider value={ensureCompanyInfo}>
      {children}
      {fieldsInfo && (
        <CompanyInfoDialog
          open
          onOpenChange={(open) => !open && setFieldsInfo(null)}
          fieldsInfo={fieldsInfo}
          canEditOrgSettings={canEditOrgSettings}
          onCancel={() => setFieldsInfo(null)}
          onComplete={() => {
            setSettingsTab(companyInfoSettingsTab(fieldsInfo));
            setFieldsInfo(null);
          }}
        />
      )}
      {settingsTab && (
        <SettingsModal
          open
          onOpenChange={(open) => !open && setSettingsTab(null)}
          initialTab={settingsTab}
        />
      )}
    </CompanyInfoGateContext.Provider>
  );
}

/**
 * `ensureCompanyInfo(action)` : exécute l'action de création si les
 * informations d'entreprise sont complètes, sinon ouvre la fenêtre pour
 * les compléter. Hors tableau de bord, l'action est exécutée telle quelle.
 */
export function useCompanyInfoGate() {
  const ensureCompanyInfo = useContext(CompanyInfoGateContext);
  return ensureCompanyInfo || ((action) => action());
}
