"use client";

import { useFormContext } from "react-hook-form";
import { PenLine } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import SignaturePad from "../signature-pad";

const LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

/**
 * Réception des marchandises : réceptionnaire, date et signature manuscrite
 * (optionnels, utiles pour une signature sur place, sur tablette). Le passage
 * au statut « Livré » se fait depuis la liste (bouton « Marquer comme livré »).
 */
export default function ReceptionSection({ canEdit }) {
  const { watch, setValue, register } = useFormContext();
  const signature = watch("signatureDataUrl");

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg flex items-center gap-2">
        <PenLine className="h-4 w-4 text-muted-foreground" />
        Réception (optionnel)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={LABEL_CLASS}>Réceptionné par</Label>
          <Input
            {...register("receivedBy")}
            placeholder="Nom du réceptionnaire"
            maxLength={100}
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label className={LABEL_CLASS}>Date de réception</Label>
          <Input type="date" {...register("receivedAt")} disabled={!canEdit} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className={LABEL_CLASS}>Signature du client</Label>
        <SignaturePad
          value={signature}
          onChange={(dataUrl) =>
            setValue("signatureDataUrl", dataUrl, { shouldDirty: true })
          }
          disabled={!canEdit}
        />
      </div>
    </div>
  );
}
