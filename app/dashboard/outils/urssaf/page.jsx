"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { GET_URSSAF_OVERVIEW } from "@/src/graphql/queries/urssafDeclaration";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { formatUrssafDay } from "@/src/utils/urssaf-declaration";
import { UrssafPageSkeleton } from "./components/urssaf-page-skeleton";
import { UrssafPeriodList } from "./components/urssaf-period-list";
import { UrssafDeclarationPanel } from "./components/urssaf-declaration-panel";
import {
  UrssafEstimateNotice,
  UrssafNotMicroCard,
  UrssafSetupCard,
  openLegalSettings,
} from "./components/urssaf-situation";

function situationLineOf(overview) {
  if (!overview) return "";
  const acre =
    overview.hasAcre === true
      ? overview.acreEndDate
        ? `ACRE jusqu'au ${formatUrssafDay(overview.acreEndDate)}`
        : "ACRE"
      : null;
  return [
    overview.activityLabel,
    overview.frequencyLabel &&
      `déclaration ${overview.frequencyLabel.toLowerCase()}`,
    acre,
    overview.hasIncomeTaxWithholding === true && "versement libératoire",
  ]
    .filter(Boolean)
    .join(" · ");
}

function UrssafDeclarationContent() {
  const { workspaceId } = useRequiredWorkspace();
  const { canDo, isReady } = useMyPermissions();
  const searchParams = useSearchParams();
  const requestedKey = searchParams.get("periode");
  const [selectedKey, setSelectedKey] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_URSSAF_OVERVIEW, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const overview = data?.urssafOverview;

  if (!overview && (loading || !workspaceId)) return <UrssafPageSkeleton />;

  const periods = overview?.periods || [];
  const isKnown = (key) => periods.some((period) => period.key === key);
  const activeKey =
    (isKnown(selectedKey) && selectedKey) ||
    (isKnown(requestedKey) && requestedKey) ||
    overview?.defaultPeriodKey;
  const situationLine = situationLineOf(overview);

  return (
    <div className="flex min-h-full flex-col px-4 pt-4 pb-8 sm:px-6 sm:pt-6">
      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-medium">Déclaration Urssaf</h1>
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
        {overview?.situation === "MICRO" && overview.rhythm && (
          <p className="text-muted-foreground mt-1 text-sm">
            {overview.rhythm}
          </p>
        )}
      </header>

      {error && !overview && (
        <div className="max-w-2xl rounded-lg border p-5 text-sm" role="alert">
          <p>Votre situation de micro-entrepreneur n'a pas pu être chargée.</p>
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
        <UrssafSetupCard missing={overview.missing} />
      )}
      {overview?.situation === "NOT_MICRO" && (
        <UrssafNotMicroCard rhythm={overview.rhythm} />
      )}

      {overview?.situation === "MICRO" && (
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <UrssafPeriodList
              periods={periods}
              selectedKey={activeKey}
              onSelect={setSelectedKey}
            />
            <UrssafEstimateNotice missing={overview.estimateMissing} />
          </div>
          {activeKey ? (
            <UrssafDeclarationPanel
              workspaceId={workspaceId}
              periodKey={activeKey}
              activity={overview.activity}
              canConfirm={!isReady || canDo("urssaf", "edit")}
              onPeriodChanged={setSelectedKey}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucune période à déclarer pour l'instant.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function UrssafDeclarationPage() {
  return (
    <Suspense fallback={<UrssafPageSkeleton />}>
      <UrssafDeclarationContent />
    </Suspense>
  );
}
