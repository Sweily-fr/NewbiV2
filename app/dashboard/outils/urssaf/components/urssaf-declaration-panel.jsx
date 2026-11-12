"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  Undo2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "@/src/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { cn } from "@/src/lib/utils";
import {
  CANCEL_URSSAF_DECLARATION,
  CONFIRM_URSSAF_DECLARATION,
  GET_URSSAF_DECLARATION,
  GET_URSSAF_OVERVIEW,
} from "@/src/graphql/queries/urssafDeclaration";
import {
  URSSAF_FILING_URL,
  URSSAF_PERIOD_STATUS,
  formatUrssafCents,
  formatUrssafDay,
  formatUrssafEuros,
  formatUrssafRate,
  urssafAdjustmentFields,
  urssafAdjustmentsInput,
  urssafResultSummary,
} from "@/src/utils/urssaf-declaration";

const RECALCULATION_DELAY_MS = 400;

function CopyAmountButton({ amount, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(amount));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible : sélectionnez le montant à la main.");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copier le montant : ${label}`}
      className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

// Chiffre d'affaires : à recopier case par case, en euros entiers
function RevenueLine({ line }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_1.75rem] items-center gap-x-2 px-3 py-2 text-sm",
        line.isTotal && "bg-muted/50 font-medium",
      )}
    >
      <span className="min-w-0">
        {line.label}
        {line.note && (
          <span className="text-muted-foreground block text-xs font-normal">
            {line.note}
          </span>
        )}
      </span>
      <span className="text-right tabular-nums">
        {formatUrssafEuros(line.amount)}
      </span>
      {line.isTotal ? (
        <span aria-hidden="true" />
      ) : (
        <CopyAmountButton amount={line.amount} label={line.label} />
      )}
    </div>
  );
}

// Cotisations : estimation au centime, avec base et taux
function ContributionLine({ line }) {
  const hasRate = line.rate !== null && line.rate !== undefined;
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-2 text-sm",
        line.isTotal && "bg-muted/50 font-medium",
      )}
    >
      <span className="min-w-0">
        {line.label}
        {hasRate && line.base !== null && line.base !== undefined && (
          <span className="text-muted-foreground block text-xs font-normal tabular-nums">
            {formatUrssafRate(line.rate)} de {formatUrssafEuros(line.base)}
          </span>
        )}
        {line.note && (
          <span className="text-muted-foreground block text-xs font-normal">
            {line.note}
          </span>
        )}
      </span>
      <span className="text-right tabular-nums">
        {formatUrssafCents(line.amount)}
      </span>
    </div>
  );
}

function DeclarationSection({ section }) {
  const Line = section.key === "revenue" ? RevenueLine : ContributionLine;
  return (
    <section>
      <h3 className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide uppercase">
        {section.title}
      </h3>
      <div className="divide-border/60 divide-y">
        {section.lines.map((line) => (
          <Line key={line.key} line={line} />
        ))}
      </div>
    </section>
  );
}

function CheckRow({ check }) {
  const isWarning = check.severity === "WARNING";
  const Icon = isWarning ? AlertTriangle : Info;
  const hasDocuments = check.documents.length > 0;
  const content = (
    <span className="flex gap-2 text-left text-sm">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          isWarning ? "text-amber-600" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        {check.label}
        {check.count > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {" "}
            ({check.count})
          </span>
        )}
      </span>
      {hasDocuments && (
        <ChevronDown
          className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      )}
    </span>
  );
  if (!hasDocuments) return <div className="px-3 py-2.5">{content}</div>;
  return (
    <Collapsible>
      <CollapsibleTrigger className="group hover:bg-accent/50 w-full cursor-pointer px-3 py-2.5">
        {content}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="text-muted-foreground space-y-1 px-9 pb-3 text-xs">
          {check.documents.map((document, index) => (
            <li
              key={`${document.label}-${index}`}
              className="flex justify-between gap-3"
            >
              <span className="truncate">{document.label}</span>
              {document.amount !== null && (
                <span className="shrink-0 tabular-nums">
                  {formatUrssafCents(document.amount)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AdjustmentsForm({ fields, values, onChange }) {
  return (
    <div className="grid gap-x-6 gap-y-4 px-3 pt-1 pb-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `urssaf-adjustment-${field.key}`;
        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-sm font-normal">
              {field.label}
            </Label>
            <div className="relative">
              <Input
                id={id}
                inputMode="numeric"
                placeholder="0"
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  onChange(
                    field.key,
                    event.target.value.replace(/[^\d]/g, "").slice(0, 10),
                  )
                }
                className="pr-7 tabular-nums"
              />
              <span
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
                aria-hidden="true"
              >
                €
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultBanner({ declaration }) {
  const result = urssafResultSummary(declaration);
  const { period } = declaration;
  const status = URSSAF_PERIOD_STATUS[period.status];
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 rounded-lg border p-5">
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium">{period.label}</span>
          <span className={cn("ml-2 text-xs", status?.className)}>
            {status?.label}
          </span>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Encaissements du {formatUrssafDay(period.start)} au{" "}
          {formatUrssafDay(period.end)}
        </p>
        {period.status !== "DECLARED" && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            Date limite : {formatUrssafDay(period.dueDate)}
          </p>
        )}
      </div>
      <div className="sm:text-right">
        <p className="text-muted-foreground text-xs">{result.title}</p>
        {result.amount !== null && (
          <p className="text-2xl font-medium tabular-nums">
            {result.isCents
              ? formatUrssafCents(result.amount)
              : formatUrssafEuros(result.amount)}
          </p>
        )}
        <p className="text-muted-foreground mt-0.5 max-w-xs text-xs">
          {result.detail}
        </p>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export function UrssafDeclarationPanel({
  workspaceId,
  periodKey,
  activity,
  canConfirm,
  onPeriodChanged,
}) {
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Une période a ses propres montants saisis
  useEffect(() => {
    setValues({});
    setSubmitted({});
  }, [periodKey, workspaceId]);

  useEffect(() => {
    const timer = setTimeout(
      () => setSubmitted(urssafAdjustmentsInput(values)),
      RECALCULATION_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [values]);

  const { data, previousData, loading, error, refetch } = useQuery(
    GET_URSSAF_DECLARATION,
    {
      variables: { workspaceId, periodKey, adjustments: submitted },
      skip: !workspaceId || !periodKey,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
  );
  // Pendant un recalcul, les montants précédents de cette période restent
  // affichés ; jamais ceux d'une autre période
  const lastDeclaration =
    data?.urssafDeclaration || previousData?.urssafDeclaration;
  const declaration =
    lastDeclaration?.period?.key === periodKey ? lastDeclaration : null;

  const refetchQueries = [
    { query: GET_URSSAF_OVERVIEW, variables: { workspaceId } },
  ];
  const [confirmDeclaration, { loading: confirming }] = useMutation(
    CONFIRM_URSSAF_DECLARATION,
    { refetchQueries },
  );
  const [cancelDeclaration, { loading: cancelling }] = useMutation(
    CANCEL_URSSAF_DECLARATION,
  );

  const fields = useMemo(() => urssafAdjustmentFields(activity), [activity]);

  if (error && !declaration) {
    return (
      <div className="rounded-lg border p-5 text-sm" role="alert">
        <p>Le calcul de cette période n'a pas abouti.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  }
  if (!declaration) return <PanelSkeleton />;

  const { period, checks, sections } = declaration;
  const isDeclared = period.status === "DECLARED";
  const warnings = checks.filter((check) => check.severity === "WARNING");
  const revenueSections = sections.filter((s) => s.key === "revenue");
  const estimateSections = sections.filter(
    (s) => s.key !== "revenue" && s.lines.length > 0,
  );

  const handleConfirm = async () => {
    try {
      await confirmDeclaration({
        variables: {
          workspaceId,
          periodKey,
          adjustments: urssafAdjustmentsInput(values),
        },
      });
      await refetch();
      setConfirmOpen(false);
      // La période ouverte par défaut change (la suivante à déclarer) : on
      // reste sur celle qui vient d'être confirmée
      onPeriodChanged?.(periodKey);
      toast.success("Déclaration enregistrée dans votre historique.");
    } catch (mutationError) {
      setConfirmOpen(false);
      toast.error(mutationError?.message || "La confirmation n'a pas abouti.");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelDeclaration({
        variables: { workspaceId, periodKey },
        refetchQueries,
      });
      await refetch();
      setCancelOpen(false);
      onPeriodChanged?.(periodKey);
      toast.success("Confirmation annulée.");
    } catch (mutationError) {
      setCancelOpen(false);
      toast.error(mutationError?.message || "L'annulation n'a pas abouti.");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <ResultBanner declaration={declaration} />

      {period.status === "IN_PROGRESS" && (
        <p className="text-muted-foreground flex gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{declaration.cannotConfirmReason}</span>
        </p>
      )}

      {!isDeclared && checks.length > 0 && (
        <section aria-labelledby="urssaf-checks-title">
          <h2 id="urssaf-checks-title" className="mb-2 text-sm font-medium">
            À vérifier avant de déclarer
            {warnings.length > 0 && (
              <span className="text-muted-foreground font-normal">
                {" "}
                · {warnings.length} {warnings.length > 1 ? "points" : "point"}{" "}
                peuvent changer les montants
              </span>
            )}
          </h2>
          <div className="divide-y rounded-lg border">
            {checks.map((check) => (
              <CheckRow key={check.code} check={check} />
            ))}
          </div>
        </section>
      )}

      {!isDeclared && fields.length > 0 && (
        <Collapsible className="rounded-lg border">
          <CollapsibleTrigger className="group hover:bg-accent/50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium">
            Encaissements à ajouter à la main
            <ChevronDown
              className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AdjustmentsForm
              fields={fields}
              values={values}
              onChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      <section aria-labelledby="urssaf-revenue-title">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="urssaf-revenue-title" className="text-sm font-medium">
            {isDeclared
              ? "Chiffre d'affaires déclaré"
              : "Chiffre d'affaires à reporter sur autoentrepreneur.urssaf.fr"}
            {loading && !isDeclared && (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                Calcul en cours…
              </span>
            )}
          </h2>
          {!isDeclared && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={URSSAF_FILING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir autoentrepreneur.urssaf.fr
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </Button>
          )}
        </div>
        <div className="divide-y rounded-lg border">
          {revenueSections.map((section) => (
            <DeclarationSection key={section.key} section={section} />
          ))}
        </div>
      </section>

      {estimateSections.length > 0 && (
        <section aria-labelledby="urssaf-estimate-title">
          <h2 id="urssaf-estimate-title" className="mb-2 text-sm font-medium">
            {isDeclared ? "Cotisations estimées" : "Estimation des cotisations"}
          </h2>
          <div className="divide-y rounded-lg border">
            {estimateSections.map((section) => (
              <DeclarationSection key={section.key} section={section} />
            ))}
          </div>
          {declaration.situation?.ratesLabel && (
            <p className="text-muted-foreground mt-2 text-xs">
              {declaration.situation.ratesLabel}
            </p>
          )}
        </section>
      )}

      <p className="text-muted-foreground text-xs">
        {isDeclared
          ? `Confirmée le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(period.declaredAt))}${declaration.declaredByName ? ` par ${declaration.declaredByName}` : ""}. Pour corriger un montant, contactez l'Urssaf depuis votre espace autoentrepreneur.urssaf.fr.`
          : "Calcul à partir de vos factures payées, factures importées et avoirs. Ce récapitulatif reste à vérifier : vous déclarez vous-même sur autoentrepreneur.urssaf.fr, qui calcule le montant exact des cotisations."}
      </p>

      {canConfirm && !isDeclared && period.status !== "IN_PROGRESS" && (
        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button
            className="bg-[#5a50ff] hover:bg-[#5a50ff]/90"
            onClick={() => setConfirmOpen(true)}
          >
            J'ai fait cette déclaration
          </Button>
          <p className="text-muted-foreground text-xs">
            Fige les montants et marque l'échéance comme faite dans le
            calendrier.
          </p>
        </div>
      )}
      {canConfirm && isDeclared && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5"
          onClick={() => setCancelOpen(true)}
        >
          <Undo2 className="size-3.5" aria-hidden="true" />
          Annuler la confirmation
        </Button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la déclaration : {period.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Newbi ne transmet rien à l'Urssaf : confirmez seulement si vous
              avez fait cette déclaration sur autoentrepreneur.urssaf.fr. Les
              montants seront figés dans votre historique.
              {warnings.length > 0 &&
                ` ${warnings.length > 1 ? `${warnings.length} points restent` : "Un point reste"} à vérifier.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#5a50ff] hover:bg-[#5a50ff]/90"
              disabled={confirming}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette confirmation ?</AlertDialogTitle>
            <AlertDialogDescription>
              La période revient à déclarer et ses montants seront recalculés.
              Rien ne change à l'Urssaf : une déclaration déjà faite reste
              faite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Fermer</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault();
                handleCancel();
              }}
            >
              Annuler la confirmation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
