"use client";

import { Fragment } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  GripVertical,
  LayoutTemplate,
  Lock,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import {
  BLOCK_LABELS,
  RICH_TEXT_TYPES,
  fontStack,
} from "@/src/utils/email-campaign-design";
import { BlockView, EmailFooterView } from "../email-design/email-blocks";
import { useRichTextEditor } from "./rich-text-editor";

/** Ligne qui montre où le bloc glissé sera déposé. */
function DropLine() {
  return (
    <div className="relative h-0" aria-hidden>
      <div className="absolute inset-x-0 -top-px z-30 h-0.5 rounded-full bg-[#5a50ff] shadow-[0_0_0_3px_rgba(90,80,255,0.15)]">
        <span className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full bg-[#5a50ff]" />
        <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-[#5a50ff]" />
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md text-[#4b4d55] transition-colors hover:bg-[#f1f1f3] hover:text-[#242529] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-white/75 dark:hover:bg-white/10",
        danger &&
          "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400",
      )}
    >
      {children}
    </button>
  );
}

/** Coins du cadre repris par le premier et le dernier bloc (images pleine largeur). */
const cornerStyle = (radius, first, last) => ({
  overflow: "hidden",
  borderTopLeftRadius: first ? radius : 0,
  borderTopRightRadius: first ? radius : 0,
  borderBottomLeftRadius: last ? radius : 0,
  borderBottomRightRadius: last ? radius : 0,
});

/** Bloc de texte sélectionné : Tiptap à la place du texte, barre au-dessus. */
function RichBlockContent({ block, style, corners, onUpdate, variables }) {
  const rich = useRichTextEditor({
    html: block.html,
    variables,
    allowLists: block.type !== "heading",
    placeholder:
      block.type === "heading" ? "Votre titre" : "Écrivez votre texte",
    onChange: (html) => onUpdate({ html }, "html"),
  });
  return (
    <>
      <div className="absolute bottom-full left-0 z-40 mb-2">
        {rich.toolbar}
      </div>
      <div style={corners}>
        <BlockView
          block={block}
          style={style}
          renderRichText={() => rich.content}
        />
      </div>
    </>
  );
}

function CanvasBlock({
  block,
  style,
  index,
  count,
  selected,
  readOnly,
  variables,
  onSelect,
  onUpdate,
  onMove,
  onDuplicate,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { source: "canvas" },
    disabled: readOnly,
  });
  const corners = cornerStyle(
    style.contentRadius,
    index === 0,
    index === count - 1,
  );
  const rich = selected && !readOnly && RICH_TEXT_TYPES.includes(block.type);
  const visible = selected || isDragging;

  return (
    <div
      ref={setNodeRef}
      data-block-id={block.id}
      role="group"
      aria-label={`Bloc ${BLOCK_LABELS[block.type]}`}
      tabIndex={readOnly ? undefined : 0}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={(event) => {
        // Les liens de l'e-mail ne s'ouvrent pas dans l'éditeur
        event.preventDefault();
        event.stopPropagation();
        if (!readOnly) onSelect(block.id);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(block.id);
        }
      }}
      className={cn(
        "group/block relative outline-none",
        readOnly ? "cursor-default" : "cursor-pointer",
        isDragging && "z-30",
        selected && "z-20",
      )}
    >
      {/* Contour : au survol, plus marqué une fois sélectionné */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-[5] transition-shadow duration-100",
          visible
            ? "shadow-[inset_0_0_0_2px_#5a50ff]"
            : !readOnly &&
                "group-hover/block:shadow-[inset_0_0_0_1px_rgba(90,80,255,0.6)] group-focus-visible/block:shadow-[inset_0_0_0_2px_#5a50ff]",
        )}
      />

      {!readOnly && (
        <>
          {/* Poignée à gauche du cadre (zone de prise jusqu'au bord du bloc) */}
          <div
            className={cn(
              "absolute top-1/2 right-full z-20 -translate-y-1/2 pr-2 transition-opacity",
              visible
                ? "opacity-100"
                : "opacity-0 group-hover/block:opacity-100",
            )}
          >
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={`Déplacer le bloc ${BLOCK_LABELS[block.type]}`}
              title="Glisser pour déplacer"
              onClick={(event) => event.stopPropagation()}
              className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded-md border border-[#e6e7ea] bg-white text-[#6b6d75] shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:text-[#242529] active:cursor-grabbing dark:border-[#2E2E32] dark:bg-[#1c1c1f] dark:text-white/70"
            >
              <GripVertical className="size-3.5" aria-hidden />
            </button>
          </div>

          {/* Actions à droite du cadre */}
          <div
            className={cn(
              "absolute top-0 left-full z-20 pl-2 transition-opacity",
              visible
                ? "opacity-100"
                : "pointer-events-none opacity-0 group-hover/block:pointer-events-auto group-hover/block:opacity-100",
            )}
          >
            <div className="flex flex-col gap-0.5 rounded-lg border border-[#e6e7ea] bg-white p-0.5 shadow-[0_2px_8px_rgba(15,23,42,0.08)] dark:border-[#2E2E32] dark:bg-[#1c1c1f]">
              <ActionButton
                label="Monter"
                onClick={() => onMove(block.id, -1)}
                disabled={index === 0}
              >
                <ArrowUp className="size-3.5" />
              </ActionButton>
              <ActionButton
                label="Descendre"
                onClick={() => onMove(block.id, 1)}
                disabled={index === count - 1}
              >
                <ArrowDown className="size-3.5" />
              </ActionButton>
              <ActionButton
                label="Dupliquer"
                onClick={() => onDuplicate(block.id)}
              >
                <CopyPlus className="size-3.5" />
              </ActionButton>
              <ActionButton
                label="Supprimer"
                onClick={() => onRemove(block.id)}
                danger
              >
                <Trash2 className="size-3.5" />
              </ActionButton>
            </div>
          </div>
        </>
      )}

      {rich ? (
        <RichBlockContent
          block={block}
          style={style}
          corners={corners}
          variables={variables}
          onUpdate={(patch, key) => onUpdate(block.id, patch, key)}
        />
      ) : (
        <div style={corners}>
          <BlockView block={block} style={style} />
        </div>
      )}
    </div>
  );
}

/** E-mail vide : zone où déposer le premier bloc. */
function EmptyFrame({ highlighted }) {
  return (
    <div className="p-6">
      <div
        className={cn(
          "flex h-56 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
          highlighted
            ? "border-[#5a50ff] bg-[#5a50ff]/[0.04]"
            : "border-[#d4d5da]",
        )}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <LayoutTemplate className="size-6 text-[#9a9ca3]" aria-hidden />
        <p className="text-sm font-medium text-[#3f4046]">
          Votre e-mail est vide
        </p>
        <p className="max-w-[300px] text-xs leading-5 text-[#6b6d75]">
          Glissez un bloc ici, ou cliquez sur un bloc dans le panneau de gauche
          pour l&apos;ajouter.
        </p>
      </div>
    </div>
  );
}

/**
 * Toile de l'éditeur : l'e-mail tel qu'il partira (fond, cadre, polices,
 * couleurs), blocs triables au glisser, sélection, ligne de dépôt d'un
 * nouveau bloc, et pied de page ajouté par l'API, grisé et non modifiable.
 */
export function EditorCanvas({
  design,
  style,
  selectedId,
  dropIndex,
  paletteDragging,
  readOnly,
  variables,
  companyName,
  companyAddress,
  canvasRef,
  onSelect,
  onDeselect,
  onUpdate,
  onMove,
  onDuplicate,
  onRemove,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  const blocks = design.blocks || [];
  const ids = blocks.map((block) => block.id);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (canvasRef) canvasRef.current = node;
      }}
      onClick={onDeselect}
      className="min-h-full px-14 pt-16 pb-20 transition-colors"
      style={{ backgroundColor: style.backgroundColor }}
    >
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: style.contentWidth,
          fontFamily: fontStack(style.fontFamily),
          "--ec-link": style.linkColor,
        }}
      >
        <div
          className="relative shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)]"
          style={{
            backgroundColor: style.contentBackgroundColor,
            borderRadius: style.contentRadius,
            color: style.textColor,
          }}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <Fragment key={block.id}>
                {dropIndex === index && <DropLine />}
                <CanvasBlock
                  block={block}
                  style={style}
                  index={index}
                  count={blocks.length}
                  selected={block.id === selectedId}
                  readOnly={readOnly}
                  variables={variables}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onMove={onMove}
                  onDuplicate={onDuplicate}
                  onRemove={onRemove}
                />
              </Fragment>
            ))}
            {blocks.length > 0 && dropIndex === blocks.length && <DropLine />}
          </SortableContext>
          {blocks.length === 0 && (
            <EmptyFrame highlighted={paletteDragging && isOver} />
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="relative mt-2 cursor-default select-none"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none opacity-80">
                <EmailFooterView
                  style={style}
                  companyName={companyName}
                  companyAddress={companyAddress}
                  addressMissingHint
                />
              </div>
              <span
                className="absolute top-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#6b6d75] dark:bg-white/10 dark:text-white/60"
                style={{
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                }}
              >
                <Lock className="size-2.5" aria-hidden />
                Pied de page automatique
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-center">
            Ajouté automatiquement, obligatoire dans un e-mail commercial :
            identité de votre entreprise et lien de désinscription.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
