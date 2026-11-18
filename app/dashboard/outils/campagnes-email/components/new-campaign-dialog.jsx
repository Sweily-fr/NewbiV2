"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import {
  CREATE_EMAIL_CAMPAIGN,
  GET_EMAIL_CAMPAIGN_TEMPLATES,
} from "@/src/graphql/emailCampaignQueries";
import { defaultCampaignName } from "@/src/utils/email-campaigns";
import { StaticEmail } from "./email-design/email-blocks";
import {
  FOCUS_RING,
  campaignUrl,
  errorMessage,
  useElementWidth,
} from "./shared";

// Largeur de rendu des vignettes (e-mail de 600 px et un peu de son fond)
const RENDER_WIDTH = 640;

/**
 * E-mail réduit dans une vignette (largeur du conteneur, hauteur `height`),
 * ni cliquable ni atteignable au clavier.
 */
export function DesignThumbnail({
  design,
  height,
  companyName,
  companyAddress,
  className,
}) {
  const [ref, width] = useElementWidth();
  const scale = width / RENDER_WIDTH;
  return (
    <div
      ref={ref}
      aria-hidden
      inert
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      {width > 0 && (
        <div
          className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
          style={{ width: RENDER_WIDTH, transform: `scale(${scale})` }}
        >
          <StaticEmail
            design={design}
            companyName={companyName}
            companyAddress={companyAddress}
          />
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
  companyName,
  companyAddress,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-[border-color,box-shadow] duration-150",
        FOCUS_RING,
        selected
          ? "border-[#5a50ff] shadow-[0_0_0_3px_rgba(90,80,255,0.15)]"
          : "border-[#e6e7ea] hover:border-[#c9cbd1] dark:border-[#2E2E32] dark:hover:border-[#44444A]",
      )}
    >
      <div className="relative w-full overflow-hidden border-b border-[#EEEFF1] bg-[#f4f4f5] dark:border-[#232323]">
        <DesignThumbnail
          design={template.design}
          height={168}
          companyName={companyName}
          companyAddress={companyAddress}
        />
        {/* Fondu en bas : l'e-mail continue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#f4f4f5] to-transparent" />
        {selected && (
          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#5a50ff] text-white shadow-sm">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2.5">
        <span className="truncate text-sm font-medium">{template.name}</span>
        <span className="line-clamp-2 text-xs leading-4 text-muted-foreground">
          {template.description}
        </span>
      </div>
    </button>
  );
}

/**
 * Fenêtre « Nouvelle campagne » : nom (visible de l'équipe seulement) et
 * modèle de départ en vignettes, puis la page de la campagne.
 */
export function NewCampaignDialog({
  open,
  onOpenChange,
  workspaceId,
  companyName,
  companyAddress,
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    GET_EMAIL_CAMPAIGN_TEMPLATES,
    {
      variables: { workspaceId },
      skip: !open || !workspaceId,
      fetchPolicy: "cache-first",
      context: { skipErrorToast: true },
    },
  );
  const templates = useMemo(() => data?.emailCampaignTemplates || [], [data]);

  // Chaque ouverture repart d'un nom daté et du premier modèle
  useEffect(() => {
    if (open) {
      setName(defaultCampaignName());
      setCreating(false);
    }
  }, [open]);
  useEffect(() => {
    if (!templateKey && templates.length) setTemplateKey(templates[0].key);
  }, [templates, templateKey]);

  const [createCampaign] = useMutation(CREATE_EMAIL_CAMPAIGN, {
    errorPolicy: "none",
  });

  const handleCreate = async (event) => {
    event?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const { data: created } = await createCampaign({
        variables: {
          workspaceId,
          input: { name: trimmed, templateKey: templateKey || null },
        },
      });
      router.push(campaignUrl(created.createEmailCampaign.id));
    } catch (createError) {
      toast.error("Création impossible", {
        description: errorMessage(createError),
      });
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !creating && onOpenChange(next)}
    >
      <DialogContent className="flex max-h-[min(94vh,860px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-medium">
              Nouvelle campagne
            </DialogTitle>
            <DialogDescription>
              Choisissez un point de départ : textes, images, couleurs et
              boutons restent modifiables ensuite.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="campaign-name"
                className="text-xs font-medium text-black/55 dark:text-white/55"
              >
                Nom de la campagne
              </Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                autoFocus
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Pour vous repérer dans la liste : vos contacts ne le voient pas.
              </p>
            </div>

            <p className="mt-6 mb-2 text-xs font-medium text-black/55 dark:text-white/55">
              Modèle
            </p>
            {loading && !templates.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Skeleton key={index} className="h-[232px] rounded-xl" />
                ))}
              </div>
            ) : error && !templates.length ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-4">
                <p className="text-sm text-muted-foreground">
                  Les modèles n&apos;ont pas pu être chargés. Vous pouvez
                  réessayer, ou partir d&apos;un e-mail vierge.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <div
                role="radiogroup"
                aria-label="Modèle de départ"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {templates.map((template) => (
                  <TemplateCard
                    key={template.key}
                    template={template}
                    selected={template.key === templateKey}
                    onSelect={() => setTemplateKey(template.key)}
                    companyName={companyName}
                    companyAddress={companyAddress}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-[#EEEFF1] px-6 py-4 dark:border-[#232323]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim() || creating}
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              Créer la campagne
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
