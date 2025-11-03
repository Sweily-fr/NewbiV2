"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModernQuoteEditor from "../components/modern-quote-editor";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertCircle } from "lucide-react";

function NewQuoteContent() {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canCreate("quotes");
      setHasPermission(allowed);

      if (!allowed) {
        setTimeout(() => {
          router.push("/dashboard/outils/devis");
        }, 2000);
      }
    };

    checkPermission();
  }, [canCreate, router]);

  // Chargement
  if (hasPermission === null) {
    return <QuoteEditorSkeleton />;
  }

  // Pas de permission
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas la permission de créer des devis. Redirection...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Suspense fallback={<QuoteEditorSkeleton />}>
      <ModernQuoteEditor mode="create" />
    </Suspense>
  );
}

export default function NewQuotePage() {
  return (
    <ProRouteGuard pageName="Nouveau devis">
      <CompanyInfoGuard>
        <NewQuoteContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}

function QuoteEditorSkeleton() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
      {/* Editor skeleton */}
      <div className="space-y-6 p-6">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview skeleton */}
      <div className="rounded-lg border p-6">
        <Skeleton className="h-6 w-[100px] mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
