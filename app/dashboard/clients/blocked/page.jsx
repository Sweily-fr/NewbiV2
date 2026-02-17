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
import { ShieldOff } from "lucide-react";

function BlockedContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl font-medium mb-0">Contacts bloqués</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les contacts que vous avez bloqués.
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <Empty>
          <EmptyMedia variant="icon">
            <ShieldOff />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Bientôt disponible</EmptyTitle>
            <EmptyDescription>
              Vous pourrez bientôt bloquer des contacts pour les exclure de vos
              communications et documents.
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

export default function BlockedPage() {
  return (
    <ProRouteGuard pageName="Clients">
      <BlockedContent />
    </ProRouteGuard>
  );
}
