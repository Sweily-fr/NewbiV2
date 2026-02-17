"use client";

import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/src/components/ui/empty";
import { Filter } from "lucide-react";

function SegmentsContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">Segments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez des segments dynamiques pour cibler vos contacts.
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <Empty>
          <EmptyMedia variant="icon">
            <Filter />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Bientôt disponible</EmptyTitle>
            <EmptyDescription>
              Les segments vous permettront de filtrer automatiquement vos
              contacts selon des critères dynamiques.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/clients")}
              className="font-normal"
            >
              Retour aux contacts
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}

export default function SegmentsPage() {
  return (
    <ProRouteGuard pageName="Clients">
      <SegmentsContent />
    </ProRouteGuard>
  );
}
