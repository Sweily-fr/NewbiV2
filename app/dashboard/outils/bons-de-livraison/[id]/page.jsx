"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DeliveryNotePageSkeleton } from "../components/delivery-note-page-skeleton";
import { useDeliveryNotesAccess } from "@/src/hooks/useDeliveryNotesAccess";

// Fiche d'un bon de livraison : la liste ouvre le panneau de détail via ?id=
// (même comportement que les liens de la palette ⌘K et des documents liés).
export default function DeliveryNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { allowed, loading } = useDeliveryNotesAccess();

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      router.replace("/dashboard");
      return;
    }
    if (params?.id) {
      router.replace(`/dashboard/outils/bons-de-livraison?id=${params.id}`);
    }
  }, [params?.id, router, allowed, loading]);

  return <DeliveryNotePageSkeleton />;
}
