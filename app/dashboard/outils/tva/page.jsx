"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { GET_VAT_OVERVIEW } from "@/src/graphql/queries/vatDeclaration";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { VAT_MODE_LABELS } from "@/src/utils/vat-declaration";
import { VatPageSkeleton } from "./components/vat-page-skeleton";
import { VatPeriodList } from "./components/vat-period-list";
import { VatReturnPanel } from "./components/vat-return-panel";
import {
  VatFranchiseCard,
  VatNotSubjectCard,
  VatSetupCard,
  openLegalSettings,
} from "./components/vat-situation";

function VatDeclarationContent() {
  const { workspaceId } = useRequiredWorkspace();
  const { canDo, isReady } = useMyPermissions();
  const searchParams = useSearchParams();
  const requestedKey = searchParams.get("periode");
  const [selectedKey, setSelectedKey] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_VAT_OVERVIEW, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const overview = data?.vatOverview;

  if (!overview && (loading || !workspaceId)) return <VatPageSkeleton />;

  const periods = overview?.periods || [];
  const isKnown = (key) => periods.some((period) => period.key === key);
  const activeKey =
    (isKnown(selectedKey) && selectedKey) ||
    (isKnown(requestedKey) && requestedKey) ||
    overview?.defaultPeriodKey;

  const situationLine = [
    overview?.regimeLabel,
    overview?.frequencyLabel &&
      `déclaration ${overview.frequencyLabel.toLowerCase()}`,
    VAT_MODE_LABELS[overview?.vatMode],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-full flex-col px-4 pt-4 pb-8 sm:px-6 sm:pt-6">
      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-medium">Déclaration de TVA</h1>
        {situationLine && (
          <p className="mt-2 text-sm">
            {situationLine}
            <button
              type="button"
              onClick={openLegalSettings}
              className="ml-2 cursor-pointer text-[#5a50ff] hover:underline"
            >
              Modifier
            </button>
          </p>
        )}
        {overview?.situation === "SUBJECT" && overview.rhythm && (
          <p className="text-muted-foreground mt-1 text-sm">
            {overview.rhythm}
          </p>
        )}
      </header>

      {error && !overview && (
        <div className="max-w-2xl rounded-lg border p-5 text-sm" role="alert">
          <p>Votre situation de TVA n'a pas pu être chargée.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Réessayer
          </Button>
        </div>
      )}

      {overview?.situation === "INCOMPLETE" && (
        <VatSetupCard missing={overview.missing} />
      )}
      {overview?.situation === "NOT_SUBJECT" && (
        <VatNotSubjectCard rhythm={overview.rhythm} />
      )}
      {overview?.situation === "FRANCHISE" && overview.franchise && (
        <VatFranchiseCard
          franchise={overview.franchise}
          rhythm={overview.rhythm}
        />
      )}

      {overview?.situation === "SUBJECT" && (
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <VatPeriodList
            periods={periods}
            selectedKey={activeKey}
            onSelect={setSelectedKey}
          />
          {activeKey && (
            <VatReturnPanel
              workspaceId={workspaceId}
              periodKey={activeKey}
              canConfirm={!isReady || canDo("vat", "edit")}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function VatDeclarationPage() {
  return (
    <Suspense fallback={<VatPageSkeleton />}>
      <VatDeclarationContent />
    </Suspense>
  );
}
