"use client";

import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { UPLOAD_EMAIL_CAMPAIGN_IMAGE } from "@/src/graphql/emailCampaignQueries";
import { errorMessage } from "../shared";
import { FIELD_LABEL } from "./controls";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Photos HEIC (iPhone) acceptées : l'API les convertit
const ACCEPTED = "image/*,.heic,.heif";

/**
 * Image d'un bloc : envoi d'un fichier (hébergé par Newbi, adresse publique
 * en https), ou adresse d'une image en ligne. Le bloc vide n'est jamais
 * envoyé.
 */
export function ImageInput({ workspaceId, src, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [upload] = useMutation(UPLOAD_EMAIL_CAMPAIGN_IMAGE, {
    errorPolicy: "none",
  });
  const isHosted = /^https?:\/\//i.test(src || "");
  const [urlDraft, setUrlDraft] = useState(isHosted ? src : "");

  const send = async (file) => {
    if (!file) return;
    // HEIC sans type reconnu (navigateur sous Windows) : son extension suffit
    const heic = /\.hei[cf]$/i.test(file.name || "");
    if (!heic && !String(file.type || "").startsWith("image/")) {
      toast.error("Choisissez une image (JPG, PNG, GIF ou WebP)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image trop lourde : 10 Mo au plus");
      return;
    }
    setBusy(true);
    try {
      const { data } = await upload({ variables: { workspaceId, file } });
      const url = data?.uploadEmailCampaignImage?.url;
      if (url) {
        onChange(url);
        setUrlDraft(url);
      }
    } catch (uploadError) {
      toast.error("L'image n'a pas pu être envoyée", {
        description: errorMessage(uploadError),
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const commitUrl = () => {
    const value = urlDraft.trim();
    if (value === (src || "")) return;
    if (value && !/^https?:\/\//i.test(value)) {
      toast.error("L'adresse de l'image doit commencer par https://");
      return;
    }
    onChange(value);
  };

  const dropProps = {
    onDragOver: (event) => {
      if (![...(event.dataTransfer?.types || [])].includes("Files")) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event) => {
      if (!event.dataTransfer?.files?.length) return;
      event.preventDefault();
      setDragging(false);
      send(event.dataTransfer.files[0]);
    },
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => send(event.target.files?.[0])}
      />
      {src ? (
        <div
          {...dropProps}
          className={cn(
            "overflow-hidden rounded-xl border border-[#e6e7ea] dark:border-[#2E2E32]",
            dragging && "border-[#5a50ff] ring-2 ring-[#5a50ff]/20",
          )}
        >
          <div className="flex h-32 items-center justify-center bg-[repeating-conic-gradient(#f4f4f5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] p-2 dark:bg-[repeating-conic-gradient(#1f1f22_0%_25%,#2a2a2e_0%_50%)]">
            {/* Image choisie par l'utilisateur, montrée telle quelle */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1 border-t border-[#EEEFF1] p-1.5 dark:border-[#232323]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Remplacer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => {
                onChange("");
                setUrlDraft("");
              }}
              disabled={busy}
            >
              <Trash2 className="size-3.5" />
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          {...dropProps}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#c9cbd1] text-center transition-colors hover:border-[#5a50ff]/60 hover:bg-[#5a50ff]/[0.03] dark:border-[#44444A]",
            dragging && "border-[#5a50ff] bg-[#5a50ff]/[0.05]",
          )}
        >
          {busy ? (
            <Loader2
              className="size-5 animate-spin text-[#5a50ff]"
              aria-hidden
            />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
          )}
          <span className="text-sm font-medium">
            {busy ? "Envoi de l'image…" : "Choisir une image"}
          </span>
          <span className="text-xs leading-5 text-muted-foreground">
            ou glissez-la ici
            <br />
            JPG, PNG, GIF ou WebP, 10 Mo au plus
          </span>
        </button>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="image-url" className={FIELD_LABEL}>
          Ou l&apos;adresse d&apos;une image en ligne
        </label>
        <Input
          id="image-url"
          value={urlDraft}
          placeholder="https://www.exemple.fr/image.jpg"
          onChange={(event) => setUrlDraft(event.target.value)}
          onBlur={commitUrl}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitUrl();
            }
          }}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
