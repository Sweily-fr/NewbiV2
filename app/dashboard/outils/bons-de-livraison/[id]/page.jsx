"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DeliveryNotePageSkeleton } from "../components/delivery-note-page-skeleton";

// Fiche d'un bon de livraison : la liste ouvre le panneau de détail via ?id=
// (même comportement que les liens de la palette ⌘K et des documents liés).
export default function DeliveryNoteDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/dashboard/outils/bons-de-livraison?id=${params.id}`);
    }
  }, [params?.id, router]);

  return <DeliveryNotePageSkeleton />;
}
