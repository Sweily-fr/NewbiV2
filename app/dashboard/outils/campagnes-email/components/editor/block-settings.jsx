"use client";

import { useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  CopyPlus,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  BLOCK_LABELS,
  LIMITS,
  RICH_TEXT_TYPES,
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  blockWithDefaults,
} from "@/src/utils/email-campaign-design";
import { checkLink } from "@/src/utils/email-campaigns";
import { unknownVariables } from "@/src/utils/email-campaign-variables";
import { SocialIcon } from "../email-design/social-icons";
import { VariableMenu, insertIntoField } from "../variable-menu";
import { BLOCK_ICONS } from "./block-icons";
import {
  Choice,
  ColorRow,
  PaddingRow,
  PanelSection,
  Row,
  SliderRow,
  SwitchRow,
} from "./controls";
import { ImageInput } from "./image-input";

const ALIGN_OPTIONS = [
  {
    value: "left",
    icon: <AlignLeft className="size-3.5" />,
    ariaLabel: "À gauche",
  },
  {
    value: "center",
    icon: <AlignCenter className="size-3.5" />,
    ariaLabel: "Centré",
  },
  {
    value: "right",
    icon: <AlignRight className="size-3.5" />,
    ariaLabel: "À droite",
  },
];

/** Message sous un lien : erreur (rouge) ou conseil (orange). */
function LinkMessage({ url, required }) {
  const result = checkLink(url, { required });
  if (!result.message) return null;
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-xs leading-5",
        result.level === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-amber-700 dark:text-amber-400",
      )}
    >
      <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
      {result.message}
    </p>
  );
}

function LinkField({
  id,
  label,
  value,
  onChange,
  required,
  placeholder = "https://www.exemple.fr",
}) {
  return (
    <Row label={label} htmlFor={id}>
      <Input
        id={id}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        inputMode="url"
      />
      <LinkMessage url={value} required={required} />
    </Row>
  );
}

/** Texte court (bouton) avec insertion de variable à la position du curseur. */
function TextWithVariableField({
  id,
  label,
  value,
  onChange,
  variables,
  placeholder,
}) {
  const ref = useRef(null);
  const unknown = unknownVariables(value, variables);
  return (
    <Row
      label={label}
      htmlFor={id}
      action={
        <VariableMenu
          variables={variables}
          onInsert={(token) =>
            insertIntoField(ref, value || "", onChange, token)
          }
        />
      }
    >
      <Input
        ref={ref}
        id={id}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={80}
        autoComplete="off"
      />
      {unknown.length > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Variable inconnue : {unknown.map((key) => `{{${key}}}`).join(", ")}
        </p>
      )}
    </Row>
  );
}

function SocialItems({ items, onChange }) {
  const used = items.map((item) => item.network);
  const available = SOCIAL_NETWORKS.filter(
    (network) => !used.includes(network),
  );
  const update = (index, patch) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={`${item.network}-${index}`} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Select
              value={item.network}
              onValueChange={(network) => update(index, { network })}
            >
              <SelectTrigger className="w-[150px] shrink-0" aria-label="Réseau">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[item.network, ...available].map((network) => (
                  <SelectItem key={network} value={network}>
                    <span className="flex items-center gap-2">
                      <SocialIcon network={network} size={16} />
                      {SOCIAL_LABELS[network]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-8 text-muted-foreground"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label={`Retirer ${SOCIAL_LABELS[item.network]}`}
              title="Retirer"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <Input
            value={item.url || ""}
            onChange={(event) => update(index, { url: event.target.value })}
            placeholder={
              item.network === "website"
                ? "https://www.exemple.fr"
                : `https://${item.network === "x" ? "x" : item.network}.com/…`
            }
            aria-label={`Adresse ${SOCIAL_LABELS[item.network]}`}
            autoComplete="off"
          />
          <LinkMessage url={item.url} required />
        </div>
      ))}
      {available.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() =>
            onChange([...items, { network: available[0], url: "" }])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          Ajouter un réseau
        </Button>
      )}
    </div>
  );
}

/**
 * Réglages du bloc sélectionné : contenu, couleurs (sélecteur partagé),
 * alignement, tailles, marges. Les textes riches se modifient dans la
 * toile ; ici leur mise en page.
 */
export function BlockSettings({
  block: raw,
  style,
  workspaceId,
  variables,
  onUpdate,
  onDuplicate,
  onRemove,
  onClose,
}) {
  const block = blockWithDefaults(raw);
  if (!block) return null;
  const Icon = BLOCK_ICONS[block.type];
  const set = (patch, key) => onUpdate(patch, key);
  const padding = (
    <PanelSection title="Marges">
      <PaddingRow
        value={block.padding}
        onChange={(patch) => set({ padding: patch }, "padding")}
      />
    </PanelSection>
  );

  let body = null;
  switch (block.type) {
    case "heading":
      body = (
        <>
          <PanelSection title="Titre">
            <Row label="Taille">
              <Choice
                label="Taille du titre"
                value={block.level}
                onChange={(level) => set({ level })}
                options={[
                  { value: 1, label: "Grand" },
                  { value: 2, label: "Moyen" },
                  { value: 3, label: "Petit" },
                ]}
              />
            </Row>
            <Row label="Alignement">
              <Choice
                label="Alignement"
                value={block.align}
                onChange={(align) => set({ align })}
                options={ALIGN_OPTIONS}
              />
            </Row>
            <ColorRow
              label="Couleur"
              value={raw.color || null}
              inherited={style.headingColor}
              onChange={(color) => set({ color }, "color")}
            />
          </PanelSection>
          {padding}
        </>
      );
      break;
    case "text":
      body = (
        <>
          <PanelSection title="Texte">
            <Row label="Alignement">
              <Choice
                label="Alignement"
                value={block.align}
                onChange={(align) => set({ align })}
                options={ALIGN_OPTIONS}
              />
            </Row>
            <SliderRow
              label="Taille du texte"
              value={block.fontSize}
              min={LIMITS.fontSize[0]}
              max={LIMITS.fontSize[1]}
              onChange={(fontSize) => set({ fontSize }, "fontSize")}
            />
            <SliderRow
              label="Interligne"
              value={block.lineHeight}
              min={LIMITS.lineHeight[0]}
              max={LIMITS.lineHeight[1]}
              step={0.1}
              unit=""
              format={(value) =>
                value.toLocaleString("fr-FR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              }
              onChange={(lineHeight) =>
                set(
                  { lineHeight: Math.round(lineHeight * 10) / 10 },
                  "lineHeight",
                )
              }
            />
            <ColorRow
              label="Couleur"
              value={raw.color || null}
              inherited={style.textColor}
              onChange={(color) => set({ color }, "color")}
            />
          </PanelSection>
          {padding}
        </>
      );
      break;
    case "button":
      body = (
        <>
          <PanelSection title="Contenu">
            <TextWithVariableField
              id="button-label"
              label="Texte du bouton"
              value={block.label}
              variables={variables}
              placeholder="Ex. : Découvrir l'offre"
              onChange={(label) => set({ label }, "label")}
            />
            <LinkField
              id="button-url"
              label="Lien"
              value={block.url}
              required
              onChange={(url) => set({ url }, "url")}
            />
          </PanelSection>
          <PanelSection title="Apparence">
            <ColorRow
              label="Couleur du bouton"
              value={raw.backgroundColor || null}
              inherited={style.primaryColor}
              onChange={(backgroundColor) =>
                set({ backgroundColor }, "backgroundColor")
              }
            />
            <ColorRow
              label="Couleur du texte"
              value={block.textColor}
              onChange={(textColor) =>
                set({ textColor: textColor || "#ffffff" }, "textColor")
              }
            />
            <SliderRow
              label="Arrondi"
              value={block.borderRadius}
              min={LIMITS.buttonRadius[0]}
              max={LIMITS.buttonRadius[1]}
              onChange={(borderRadius) => set({ borderRadius }, "borderRadius")}
            />
            <SliderRow
              label="Taille du texte"
              value={block.fontSize}
              min={LIMITS.buttonFontSize[0]}
              max={LIMITS.buttonFontSize[1]}
              onChange={(fontSize) => set({ fontSize }, "fontSize")}
            />
            <SwitchRow
              id="button-full"
              label="Pleine largeur"
              description="Le bouton occupe toute la largeur de l'e-mail."
              checked={block.fullWidth}
              onCheckedChange={(fullWidth) => set({ fullWidth })}
            />
            {!block.fullWidth && (
              <Row label="Alignement">
                <Choice
                  label="Alignement"
                  value={block.align}
                  onChange={(align) => set({ align })}
                  options={ALIGN_OPTIONS}
                />
              </Row>
            )}
          </PanelSection>
          {padding}
        </>
      );
      break;
    case "image":
      body = (
        <>
          <PanelSection title="Image">
            <ImageInput
              workspaceId={workspaceId}
              src={block.src}
              onChange={(src) => set({ src })}
            />
            <Row
              label="Texte alternatif"
              htmlFor="image-alt"
              hint="Affiché si l'image ne se charge pas, et lu aux personnes malvoyantes. Il aide aussi à ne pas finir en spam."
            >
              <Input
                id="image-alt"
                value={block.alt || ""}
                onChange={(event) => set({ alt: event.target.value }, "alt")}
                placeholder="Ex. : Notre nouvelle collection"
                autoComplete="off"
              />
            </Row>
            <LinkField
              id="image-href"
              label="Lien au clic (facultatif)"
              value={block.href}
              onChange={(href) => set({ href }, "href")}
            />
          </PanelSection>
          <PanelSection title="Mise en page">
            <SliderRow
              label="Largeur"
              value={block.width}
              min={LIMITS.imageWidth[0]}
              max={LIMITS.imageWidth[1]}
              step={5}
              unit="%"
              format={(value) => `${value} %`}
              onChange={(width) => set({ width }, "width")}
            />
            {block.width < 100 && (
              <Row label="Alignement">
                <Choice
                  label="Alignement"
                  value={block.align}
                  onChange={(align) => set({ align })}
                  options={ALIGN_OPTIONS}
                />
              </Row>
            )}
            <SliderRow
              label="Arrondi des coins"
              value={block.borderRadius}
              min={LIMITS.imageRadius[0]}
              max={LIMITS.imageRadius[1]}
              onChange={(borderRadius) => set({ borderRadius }, "borderRadius")}
            />
          </PanelSection>
          {padding}
        </>
      );
      break;
    case "imageText":
      body = (
        <>
          <PanelSection title="Image">
            <ImageInput
              workspaceId={workspaceId}
              src={block.src}
              onChange={(src) => set({ src })}
            />
            <Row label="Texte alternatif" htmlFor="image-text-alt">
              <Input
                id="image-text-alt"
                value={block.alt || ""}
                onChange={(event) => set({ alt: event.target.value }, "alt")}
                placeholder="Ce que montre l'image"
                autoComplete="off"
              />
            </Row>
            <LinkField
              id="image-text-href"
              label="Lien de l'image (facultatif)"
              value={block.href}
              onChange={(href) => set({ href }, "href")}
            />
            <Row label="Position de l'image">
              <Choice
                label="Position de l'image"
                value={block.imagePosition}
                onChange={(imagePosition) => set({ imagePosition })}
                options={[
                  { value: "left", label: "À gauche" },
                  { value: "right", label: "À droite" },
                ]}
              />
            </Row>
          </PanelSection>
          <PanelSection title="Bouton (facultatif)">
            <TextWithVariableField
              id="image-text-button"
              label="Texte du bouton"
              value={block.buttonLabel}
              variables={variables}
              placeholder="Laisser vide pour ne pas en mettre"
              onChange={(buttonLabel) => set({ buttonLabel }, "buttonLabel")}
            />
            {block.buttonLabel ? (
              <LinkField
                id="image-text-button-url"
                label="Lien du bouton"
                value={block.buttonUrl}
                required
                onChange={(buttonUrl) => set({ buttonUrl }, "buttonUrl")}
              />
            ) : null}
          </PanelSection>
          {padding}
        </>
      );
      break;
    case "divider":
      body = (
        <>
          <PanelSection title="Séparateur">
            <ColorRow
              label="Couleur"
              value={block.color}
              onChange={(color) => set({ color: color || "#e5e7eb" }, "color")}
            />
            <SliderRow
              label="Épaisseur"
              value={block.thickness}
              min={LIMITS.dividerThickness[0]}
              max={LIMITS.dividerThickness[1]}
              onChange={(thickness) => set({ thickness }, "thickness")}
            />
            <SliderRow
              label="Largeur"
              value={block.width}
              min={LIMITS.dividerWidth[0]}
              max={LIMITS.dividerWidth[1]}
              step={5}
              unit="%"
              format={(value) => `${value} %`}
              onChange={(width) => set({ width }, "width")}
            />
          </PanelSection>
          {padding}
        </>
      );
      break;
    case "spacer":
      body = (
        <PanelSection title="Espace">
          <SliderRow
            label="Hauteur"
            value={block.height}
            min={LIMITS.spacerHeight[0]}
            max={LIMITS.spacerHeight[1]}
            step={4}
            onChange={(height) => set({ height }, "height")}
          />
        </PanelSection>
      );
      break;
    case "social":
      body = (
        <>
          <PanelSection title="Réseaux">
            <SocialItems
              items={block.items}
              onChange={(items) => set({ items }, "items")}
            />
          </PanelSection>
          <PanelSection title="Apparence">
            <Row label="Style des icônes">
              <Choice
                label="Style des icônes"
                value={block.iconStyle}
                onChange={(iconStyle) => set({ iconStyle })}
                options={[
                  { value: "color", label: "Couleur" },
                  { value: "dark", label: "Sombre" },
                  { value: "light", label: "Clair" },
                ]}
              />
            </Row>
            <Row label="Alignement">
              <Choice
                label="Alignement"
                value={block.align}
                onChange={(align) => set({ align })}
                options={ALIGN_OPTIONS}
              />
            </Row>
          </PanelSection>
          {padding}
        </>
      );
      break;
    default:
      body = null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#EEEFF1] px-5 py-3 dark:border-[#232323]">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
          {Icon && <Icon className="size-3.5" aria-hidden />}
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
          {BLOCK_LABELS[block.type]}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          onClick={onDuplicate}
          aria-label="Dupliquer le bloc"
          title="Dupliquer (⌘D)"
        >
          <CopyPlus className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-red-600"
          onClick={onRemove}
          aria-label="Supprimer le bloc"
          title="Supprimer (Suppr)"
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          onClick={onClose}
          aria-label="Fermer les réglages du bloc"
          title="Fermer (Échap)"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {RICH_TEXT_TYPES.includes(block.type) && (
        <p className="shrink-0 border-b border-[#EEEFF1] bg-[#fafafa] px-5 py-2.5 text-xs leading-5 text-muted-foreground dark:border-[#232323] dark:bg-white/[0.03]">
          Le texte se modifie directement dans l&apos;e-mail : sélectionnez des
          mots pour les mettre en forme ou ajouter un lien.
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </div>
  );
}
