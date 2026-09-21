"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, PackageCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { useRecordDeliveryNoteReception } from "@/src/graphql/deliveryNoteQueries";
import { useArchiveDocumentPdf } from "@/src/hooks/useArchiveDocumentPdf";
import { formatLocalDate } from "@/src/utils/dateFormatter";
import SignaturePad from "./signature-pad";

/**
 * Dialogue « Marquer comme livré » : nom du réceptionnaire, date de réception
 * et signature manuscrite optionnelle. Passe le BL en DELIVERED et ré-archive
 * le PDF (qui porte désormais la signature).
 */
export default function DeliveryReceptionDialog({
  open,
  onOpenChange,
  deliveryNote,
  onDelivered,
}) {
  const [receivedBy, setReceivedBy] = useState("");
  const [receivedAt, setReceivedAt] = useState(formatLocalDate());
  const [signature, setSignature] = useState(null);
  const { recordReception, loading } = useRecordDeliveryNoteReception();
  const { archiveDocument } = useArchiveDocumentPdf("deliveryNote");

  useEffect(() => {
    if (open) {
      setReceivedBy(deliveryNote?.receivedBy || "");
      setReceivedAt(formatLocalDate());
      setSignature(deliveryNote?.signatureDataUrl || null);
    }
  }, [open, deliveryNote?.receivedBy, deliveryNote?.signatureDataUrl]);

  const handleConfirm = async () => {
    if (!deliveryNote?.id) return;
    try {
      const updated = await recordReception(deliveryNote.id, {
        receivedBy: receivedBy.trim(),
        receivedAt: receivedAt || null,
        signatureDataUrl: signature || null,
      });
      toast.success("Bon de livraison marqué comme livré");
      onOpenChange(false);
      onDelivered?.(updated);
      // Non bloquant : le PDF archivé doit refléter la réception
      if (updated) archiveDocument(updated);
    } catch (error) {
      toast.error(
        error?.message || "Erreur lors de l'enregistrement de la réception",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !loading && onOpenChange(value)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Confirmer la livraison
          </DialogTitle>
          <DialogDescription>
            Renseignez la réception des marchandises. La signature est
            optionnelle et apparaîtra sur le PDF du bon de livraison.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reception-received-by">Réceptionné par</Label>
              <Input
                id="reception-received-by"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Nom du réceptionnaire"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reception-received-at">Date de réception</Label>
              <Input
                id="reception-received-at"
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Signature du client (optionnel)</Label>
            <SignaturePad value={signature} onChange={setSignature} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              "Marquer comme livré"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
