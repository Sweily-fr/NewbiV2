"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Check, LayoutTemplate } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import { RENDER_TEMPLATE_V2 } from "../graphql";
import { layoutCustomized, templateLayout } from "../slots";
import HtmlFrame from "./HtmlFrame";
import { Section } from "./controls";

const THUMB_WIDTH = 560;
const THUMB_HEIGHT = 300;

function TemplateCard({ template, style, sigId, selected, onSelect }) {
  // Rendu avec les informations de la signature (nom, photo, logo…) :
  // rafraîchi à chaque ouverture de l'onglet
  const { data, loading } = useQuery(RENDER_TEMPLATE_V2, {
    variables: { templateId: template.id, style, id: sigId },
    fetchPolicy: "cache-and-network",
  });
  const html = data?.renderSignatureTemplateV2?.html;

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border text-left shadow-xs transition-[border-color,box-shadow] cursor-pointer",
        selected
          ? "border-ring"
          : "border-input hover:border-ring/60",
      )}
      aria-pressed={selected}
    >
      <div
        className="relative overflow-hidden bg-white"
        style={{ height: THUMB_HEIGHT * 0.5, width: "100%" }}
      >
        {loading && !html ? (
          <Skeleton className="absolute inset-3" />
        ) : (
          <div className="pointer-events-none absolute left-0 top-0">
            <HtmlFrame
              html={html}
              width={THUMB_WIDTH}
              height={THUMB_HEIGHT}
              scale={0.5}
              padding={16}
              title={`Modèle ${template.name}`}
            />
          </div>
        )}
      </div>
      <div
        className={cn(
          "border-t px-3 py-2.5 transition-colors",
          selected ? "bg-accent" : "bg-background",
        )}
      >
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {selected && <Check size={14} aria-hidden="true" />}
          {template.name}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {template.description}
        </div>
      </div>
    </button>
  );
}

const THUMB_COLORS = [
  "primaryColor",
  "textColor",
  "mutedColor",
  "iconColorMode",
  "iconColor",
  "separatorColor",
];

/**
 * Galerie des modèles, rendus par l'API avec les informations de la
 * signature (ou des données d'exemple tant qu'elle n'a pas de nom) et ses
 * couleurs, pour choisir en connaissance de cause.
 */
export default function TemplateGallery({ sig, update, catalog, onUndo }) {
  // Seuls les modèles proposés (les autres ne servent qu'aux signatures
  // qui les utilisent encore)
  const all = catalog?.templates || [];
  const templates = all.filter((t) => t.inGallery !== false);
  const current = all.find((t) => t.id === sig.templateId);
  // Modèle en attente de confirmation (disposition personnalisée)
  const [pending, setPending] = useState(null);

  // Le modèle apporte sa typographie et sa mise en page de départ (tout
  // reste réglable ensuite), adaptée à la présence d'une photo ; les
  // couleurs de l'utilisateur ne sont jamais touchées.
  const apply = (t) => {
    const preset = Object.fromEntries(
      Object.entries(templateLayout(t.defaults, sig) || t.preset || {}).filter(
        ([key, value]) =>
          key !== "__typename" && value !== null && value !== undefined,
      ),
    );
    update({ templateId: t.id, style: preset });
    toast.document(`Modèle ${t.name} appliqué`, {
      fallbackIcon: LayoutTemplate,
      ...(onUndo
        ? { action: { label: "Annuler", onClick: () => onUndo() } }
        : {}),
      duration: 6000,
    });
  };

  const choose = (t) => {
    const customized = layoutCustomized(sig, current);
    if (t.id === sig.templateId && !customized) return;
    if (customized) setPending(t);
    else apply(t);
  };
  // Les vignettes n'utilisent que les couleurs : les autres réglages ne
  // doivent pas relancer les 11 rendus à chaque changement
  const style = Object.fromEntries(
    THUMB_COLORS.filter((key) => sig.style?.[key]).map((key) => [
      key,
      sig.style[key],
    ]),
  );

  return (
    <Section
      title="Modèles"
      description="Chaque modèle apporte sa disposition et sa typographie. Vos textes, couleurs et images sont conservés quand vous en changez."
    >
      <div className="grid grid-cols-1 gap-4">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            style={style}
            selected={sig.templateId === t.id}
            sigId={sig.id}
            onSelect={() => choose(t)}
          />
        ))}
      </div>

      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.id === sig.templateId
                ? `Revenir au modèle ${pending?.name} ?`
                : `Appliquer le modèle ${pending?.name} ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez personnalisé la disposition (éléments déplacés,
              largeurs, espaces ou traits sur mesure). Elle sera remplacée par
              celle du modèle. Vos textes, couleurs et images sont conservés,
              et vous pourrez annuler.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Garder ma disposition
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                const t = pending;
                setPending(null);
                if (t) apply(t);
              }}
            >
              Appliquer le modèle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
