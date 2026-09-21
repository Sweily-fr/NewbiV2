"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { formatDeliveryNoteReference } from "@/src/graphql/deliveryNoteQueries";

/**
 * Télécharge le PDF d'un bon de livraison, généré côté serveur
 * (/api/delivery-notes/generate-pdf, même pipeline Puppeteer que les BC).
 */
export default function DeliveryNotePdfButton({
  deliveryNote,
  variant = "primary",
  size = "sm",
  className,
  iconOnly = false,
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    if (!deliveryNote?.id || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/delivery-notes/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryNoteId: deliveryNote.id }),
      });
      if (!response.ok) {
        throw new Error(`Génération PDF impossible (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formatDeliveryNoteReference(deliveryNote).replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("[DeliveryNotePdfButton]", error);
      toast.error("Impossible de générer le PDF du bon de livraison");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={iconOnly ? "icon" : size}
      onClick={handleDownload}
      disabled={loading}
      className={className}
      title="Télécharger le PDF"
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {!iconOnly && <span>{loading ? "Génération..." : "PDF"}</span>}
    </Button>
  );
}
