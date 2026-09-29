"use client";

import { useQuery } from "@apollo/client";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { RENDER_TEMPLATE_V2 } from "../graphql";
import { templateLayout } from "../slots";
import HtmlFrame from "./HtmlFrame";
import { Section } from "./controls";

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

/**
 * Galerie des modèles, rendus par l'API avec des données d'exemple et le
 * style courant de la signature (couleurs, police), pour choisir en
 * connaissance de cause.
 */
export default function TemplateGallery({ sig, update, catalog }) {
  const templates = catalog?.templates || [];
  const style = Object.fromEntries(
    // Les vignettes n'utilisent que les couleurs : on écarte les objets
    // imbriqués (réglages par élément, emplacements), qui portent des champs
    // GraphQL techniques refusés en entrée
    Object.entries(sig.style || {}).filter(
      ([key, value]) =>
        key !== "__typename" &&
        (value === null || typeof value !== "object" || Array.isArray(value)),
    ),
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
            onSelect={(templateId) => {
              // Le modèle apporte sa typographie et sa mise en page de départ
              // (tout reste réglable ensuite), adaptée à la présence d'une
              // photo ; les couleurs de l'utilisateur ne sont jamais touchées.
              const preset = Object.fromEntries(
                Object.entries(templateLayout(t.defaults, sig) || t.preset || {}).filter(
                  ([key, value]) => key !== "__typename" && value !== null && value !== undefined,
                ),
              );
              update({ templateId, style: preset });
            }}
          />
        ))}
      </div>
    </Section>
  );
}
