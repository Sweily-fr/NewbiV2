"use client";

import { createContext, useCallback, useContext, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import {
  documentLegalRequirements,
  isCompanyInfoComplete,
} from "@/src/hooks/useCompanyInfoGuard";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { cn } from "@/src/lib/utils";

// Formulaire chargé à la première ouverture seulement : la fenêtre est
// montée dans tout le tableau de bord (CompanyInfoGateProvider).
const CompanyInfoForm = dynamic(
  () =>
    import("@/src/components/company-info-form").then((m) => m.CompanyInfoForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

/** Champs requis pour générer un document, avec leur état. */
export function getCompanyInfoFields(organization) {
  const required = documentLegalRequirements(organization?.legalForm);
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
      ...(required.rcs
        ? [{ name: "Numéro RCS", completed: !!organization?.rcs }]
        : []),
      ...(required.capital
        ? [{ name: "Capital social", completed: !!organization?.capitalSocial }]
        : []),
    ],
  };
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
 * Fenêtre « Configuration de votre entreprise ». Avec le droit de modifier
 * l'espace : tous les champs exigés pour générer un document, avec la
 * recherche au registre (CompanyInfoForm), enregistrés sans passer par les
 * paramètres. Sinon : les champs manquants et « Contactez l'administrateur
 * de l'espace ».
 */
export function CompanyInfoDialog({
  open,
  onOpenChange,
  organization,
  canEditOrgSettings,
  onCancel,
  onSaved,
}) {
  const fieldsInfo = getCompanyInfoFields(organization);
  const allFields = [...fieldsInfo.generalFields, ...fieldsInfo.legalFields];
  const completedCount = allFields.filter((f) => f.completed).length;
  const totalCount = allFields.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-1 gap-0 border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          {/* Rien à droite du titre : la croix de fermeture y est placée. */}
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium">
              Configuration de votre entreprise
            </DialogTitle>
          </DialogHeader>

          {canEditOrgSettings ? (
            <CompanyInfoForm
              organization={organization}
              onCancel={onCancel}
              onSaved={onSaved}
            />
          ) : (
            <div className="px-5 pt-4 pb-0">
              {/* Compteur réservé à la liste : dans le formulaire, les champs
                  obligatoires sont marqués d'un astérisque. */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] text-muted-foreground">
                  Ces informations sont nécessaires pour générer vos documents.
                </p>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">
                  {completedCount}/{totalCount}
                </span>
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
                <span className="text-[13px] text-muted-foreground">
                  Contactez l&apos;administrateur de l&apos;espace
                </span>
              </div>
            </div>
          )}
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
  // Action de création en attente des informations d'entreprise.
  const [pendingAction, setPendingAction] = useState(null);

  // Lance l'action si l'espace peut générer des documents, sinon ouvre la
  // fenêtre ; l'action repart d'elle-même une fois les informations
  // enregistrées. Espace pas encore chargé : on laisse passer.
  const ensureCompanyInfo = useCallback(
    (action) => {
      if (!organization || isCompanyInfoComplete(organization)) {
        return action();
      }
      setPendingAction(() => action);
      return undefined;
    },
    [organization],
  );

  return (
    <CompanyInfoGateContext.Provider value={ensureCompanyInfo}>
      {children}
      {pendingAction && organization && (
        <CompanyInfoDialog
          open
          onOpenChange={(open) => !open && setPendingAction(null)}
          organization={organization}
          canEditOrgSettings={canEditOrgSettings}
          onCancel={() => setPendingAction(null)}
          onSaved={() => {
            const action = pendingAction;
            setPendingAction(null);
            action();
          }}
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

/**
 * Aller vers une page de création (« Nouvelle facture », conversion d'un
 * devis…) : si l'entreprise n'est pas configurée, la fenêtre s'ouvre sur la
 * page courante, au lieu d'arriver sur un éditeur bloqué derrière la
 * fenêtre ; la navigation suit l'enregistrement.
 */
export function useGoToCreation() {
  const ensureCompanyInfo = useCompanyInfoGate();
  const router = useRouter();
  return useCallback(
    (href) => ensureCompanyInfo(() => router.push(href)),
    [ensureCompanyInfo, router],
  );
}

/**
 * Même chose pour un lien (<Link>, <a>) vers une page de création :
 * `onClick={creationLinkClick(href)}`. Entreprise configurée : le lien suit
 * son cours normalement ; sinon le clic est retenu et la fenêtre s'ouvre.
 */
export function useCreationLinkClick() {
  const ensureCompanyInfo = useCompanyInfoGate();
  const router = useRouter();
  return useCallback(
    (href) => (event) => {
      // ensureCompanyInfo exécute l'action tout de suite si l'entreprise est
      // configurée, sinon plus tard, après l'enregistrement.
      let immediate = true;
      let allowed = false;
      ensureCompanyInfo(() => {
        if (immediate) allowed = true;
        else router.push(href);
      });
      immediate = false;
      if (!allowed) event?.preventDefault();
    },
    [ensureCompanyInfo, router],
  );
}
