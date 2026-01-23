/**
 * Page d'édition d'une signature email existante
 * Redirige vers la page /new avec le paramètre edit=true
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function EditSignaturePage() {
  const router = useRouter();
  const params = useParams();
  const signatureId = params.id;

  useEffect(() => {
    if (signatureId) {
      // Rediriger vers la page /new avec le paramètre edit=true et l'ID de la signature
      router.push(`/dashboard/outils/signatures-mail/new?edit=true&id=${signatureId}`);
    }
  }, [signatureId, router]);

  return null;
}
