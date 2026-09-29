"use client";

import { useQuery } from "@apollo/client";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { RENDER_TEMPLATE_V2 } from "../graphql";
import HtmlFrame from "./HtmlFrame";

const THUMB_WIDTH = 560;
const THUMB_HEIGHT = 300;

function TemplateCard({ template, style, selected, onSelect }) {
  const { data, loading } = useQuery(RENDER_TEMPLATE_V2, {
    variables: { templateId: template.id, style },
    fetchPolicy: "cache-first",
  });
  const html = data?.renderSignatureTemplateV2?.html;

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg border bg-white text-left transition-shadow hover:shadow-md dark:bg-neutral-900",
        selected
          ? "border-[#5a50ff] ring-2 ring-[#5a50ff]/30"
          : "border-neutral-200 dark:border-neutral-800",
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
        {selected && (
          <span className="absolute right-2 top-2 rounded-full bg-[#5a50ff] p-1 text-white">
            <Check size={12} />
          </span>
        )}
      </div>
      <div className="border-t px-3 py-2 dark:border-neutral-800">
        <div className="text-sm font-medium">{template.name}</div>
        <div className="text-[11px] leading-snug text-muted-foreground">{template.description}</div>
      </div>
    </button>
  );
}

/**
 * Galerie des modèles, rendus par l'API avec des données d'exemple et le
 * style courant de la signature (couleurs, police), pour choisir en
 * connaissance de cause.
 */
export default function TemplateGallery({ sig, update, catalog }) {
  const templates = catalog?.templates || [];
  const style = Object.fromEntries(
    // Les réglages par élément ne servent pas aux vignettes (et portent des
    // champs GraphQL techniques refusés en entrée)
    Object.entries(sig.style || {}).filter(([key]) => key !== "__typename" && key !== "elements"),
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Chaque modèle apporte sa disposition et sa typographie. Vos textes, couleurs et images
        sont conservés quand vous en changez.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            style={style}
            selected={sig.templateId === t.id}
            onSelect={(templateId) => {
              // Le modèle apporte sa typographie et sa mise en page de départ
              // (tout reste réglable ensuite) ; les couleurs de l'utilisateur
              // ne sont jamais touchées.
              const preset = Object.fromEntries(
                Object.entries(t.defaults || t.preset || {}).filter(
                  ([key, value]) => key !== "__typename" && value !== null && value !== undefined,
                ),
              );
              update({ templateId, style: preset });
            }}
          />
        ))}
      </div>
    </div>
  );
}
