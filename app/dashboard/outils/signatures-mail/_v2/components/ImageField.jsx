"use client";

import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { Field } from "./controls";
import ConfirmRemoveImage, { useRemoveSignatureImage } from "./ConfirmRemoveImage";
import { UPLOAD_SIGNATURE_V2_IMAGE } from "../graphql";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Zone d'image : clic ou glisser-déposer, envoi immédiat à l'API qui
 * recadre, optimise et rattache l'image à la signature.
 */
export default function ImageField({
  id,
  kind,
  label,
  hint,
  image,
  onChanged,
  aspect = "square",
  fieldId,
  compact = false,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [upload] = useMutation(UPLOAD_SIGNATURE_V2_IMAGE);
  const removeImage = useRemoveSignatureImage(id);
  // « Retirer » demande confirmation, comme la touche Suppr dans l'aperçu
  const [confirming, setConfirming] = useState(false);

  const send = async (file) => {
    if (!file) return;
    // Photo HEIC (iPhone) : sans type sur certains systèmes, reconnue à son
    // extension ; l'API la convertit
    const heic = /\.hei[cf]$/i.test(file.name || "");
    if (!file.type.startsWith("image/") && !heic) {
      toast.error("Choisissez une image (JPG, PNG ou WebP)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image trop volumineuse (10 Mo maximum)");
      return;
    }
    setBusy(true);
    try {
      const { data } = await upload({ variables: { id, kind, file } });
      onChanged(data?.uploadEmailSignatureV2Image);
      toast.success("Image ajoutée");
    } catch (err) {
      toast.error(err?.graphQLErrors?.[0]?.message || "Envoi impossible");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      const updated = await removeImage(kind);
      if (updated) onChanged(updated);
    } finally {
      setBusy(false);
    }
  };

  const input = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => send(e.target.files?.[0])}
      />
      <ConfirmRemoveImage
        kind={kind}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={clear}
      />
    </>
  );
  // Vignette seule (à côté du nom, de l'entreprise) : un clic ou un dépôt
  // pour ajouter ou changer l'image, « Retirer » dessous
  if (compact) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          id={fieldId}
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            send(e.dataTransfer.files?.[0]);
          }}
          title={`${image?.url ? "Changer" : "Ajouter"} : ${hint || label}`}
          aria-label={`${image?.url ? "Changer" : "Ajouter"} ${label.toLowerCase()}`}
          className={`flex ${aspect === "logo" ? "h-14 w-24" : "h-[72px] w-[72px]"} items-center justify-center overflow-hidden rounded-[9px] border border-dashed text-muted-foreground transition-[border] duration-[80ms] cursor-pointer ${
            dragging
              ? "border-[#5b4fff]"
              : "border-[#D1D3D8] hover:border-[#9FA1A7] dark:border-[#44444A] dark:hover:border-[#5c5c63]"
          }`}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[11px]">
              <ImagePlus size={16} />
              {label}
            </span>
          )}
        </button>
        {image?.url && !busy && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-[11px] text-muted-foreground hover:text-red-600 cursor-pointer"
          >
            Retirer
          </button>
        )}
        {input}
      </div>
    );
  }

  // Image large : la zone prend la place restante, les boutons restent visibles
  const box =
    aspect === "wide"
      ? "h-20 min-w-0 flex-1"
      : aspect === "logo"
        ? "h-16 w-32 shrink-0"
        : "h-20 w-20 shrink-0";

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3" id={fieldId}>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            send(e.dataTransfer.files?.[0]);
          }}
          className={`relative flex ${box} items-center justify-center overflow-hidden rounded-[9px] border border-dashed bg-[linear-gradient(45deg,#f5f5f5_25%,transparent_25%,transparent_75%,#f5f5f5_75%),linear-gradient(45deg,#f5f5f5_25%,transparent_25%,transparent_75%,#f5f5f5_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px] text-muted-foreground transition-[border] duration-[80ms] cursor-pointer dark:bg-none dark:bg-neutral-900 ${
            dragging
              ? "border-[#5b4fff]"
              : "border-[#D1D3D8] hover:border-[#9FA1A7] dark:border-[#44444A] dark:hover:border-[#5c5c63]"
          }`}
          title="Cliquez ou déposez une image"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={18} />
          )}
        </button>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {image?.url ? "Changer" : "Choisir une image"}
          </Button>
          {image?.url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-red-600 hover:text-red-700 cursor-pointer"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={12} />
              Retirer
            </Button>
          )}
        </div>
        {input}
      </div>
    </Field>
  );
}
