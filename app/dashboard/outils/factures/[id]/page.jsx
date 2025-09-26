"use client";

import { Suspense } from "react";
import { ArrowLeft, Send, MoreHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import ModernInvoiceEditor from "../components/modern-invoice-editor";
import { useRouter, useParams } from "next/navigation";
import { useInvoice } from "@/src/graphql/invoiceQueries";

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id;

  const { data: invoice, loading, error } = useInvoice(invoiceId);

  const handleBack = () => {
    router.push("/dashboard/outils/factures");
  };

  if (loading) {
    return <InvoiceDetailsSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Facture introuvable</h2>
          <p className="text-muted-foreground mb-4">
            Cette facture n'existe pas ou a été supprimée.
          </p>
          <Button onClick={handleBack}>Retour aux factures</Button>
        </div>
      </div>
    );
  }

  const isDraft = invoice.status === "DRAFT";
  const canEdit = isDraft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {invoice.number || "Brouillon"}
            </h1>
            <p className="text-muted-foreground">
              {invoice.client?.name || "Client non défini"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDraft && (
            <Button
              variant="outline"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem>
                Convertir en devis
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isDraft && (
                <DropdownMenuItem
                  className="text-destructive"
                >
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor */}
      <Suspense fallback={<InvoiceEditorSkeleton />}>
        <ModernInvoiceEditor
          mode={canEdit ? "edit" : "view"}
          invoiceId={invoiceId}
          initialData={invoice}
        />
      </Suspense>
    </div>
  );
}

function InvoiceDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[80px]" />
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <InvoiceEditorSkeleton />
    </div>
  );
}

function InvoiceEditorSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor skeleton */}
      <div className="space-y-6">
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
