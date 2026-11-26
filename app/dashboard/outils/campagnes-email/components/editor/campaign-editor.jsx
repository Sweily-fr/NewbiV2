"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  ArrowLeft,
  Blocks,
  Check,
  Eye,
  Loader2,
  MailCheck,
  MousePointerClick,
  Palette,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  TabsNew,
  TabsNewContent,
  TabsNewList,
  TabsNewTrigger,
} from "@/src/components/ui/tabs-new";
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
import { cn } from "@/src/lib/utils";
import {
  BLOCK_LABELS,
  MAX_BLOCKS,
  RICH_TEXT_TYPES,
  addBlock,
  createBlock,
  defaultSignatureId,
  duplicateBlock,
  findBlock,
  findBlockIndex,
  insertBlock,
  moveBlock,
  moveBlockBy,
  removeBlock,
  updateBlock,
  updateStyle,
} from "@/src/utils/email-campaign-design";
import { DEFAULT_VARIABLES } from "@/src/utils/email-campaign-variables";
import { effectiveSenderEmail } from "@/src/utils/email-sending-domain";
import {
  CampaignDataProvider,
  useCampaignDataValue,
} from "../email-design/campaign-data";
import { resolvedStyle } from "../email-design/email-blocks";
import { PreviewDialog } from "../preview-dialog";
import { TestEmailDialog } from "../test-email-dialog";
import {
  FOCUS_RING,
  campaignUrl,
  errorMessage,
  useCampaignAccess,
} from "../shared";
import { BlockSettings } from "./block-settings";
import { BlockTilePreview, BlocksPanel } from "./blocks-panel";
import { EditorCanvas } from "./editor-canvas";
import { StylePanel } from "./style-panel";
import { useCampaignEditor } from "./use-campaign-editor";

const SAVE_STATUS = {
  dirty: {
    label: "Modifications en cours…",
    className: "text-muted-foreground",
  },
  saving: { label: "Enregistrement…", className: "text-muted-foreground" },
  saved: {
    label: "Enregistré",
    className: "text-emerald-700 dark:text-emerald-400",
  },
  error: {
    label: "Non enregistré",
    className: "text-red-600 dark:text-red-400",
  },
};

function SaveStatus({ status, onRetry }) {
  const meta = SAVE_STATUS[status];
  if (!meta) return null;
  return (
    <span
      className={cn("flex shrink-0 items-center gap-1 text-xs", meta.className)}
      aria-live="polite"
    >
      {status === "saving" && (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      )}
      {status === "saved" && <Check className="size-3" aria-hidden />}
      {meta.label}
      {status === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 cursor-pointer font-medium underline underline-offset-2"
        >
          Réessayer
        </button>
      )}
    </span>
  );
}

/** Panneau droit sans bloc sélectionné : mode d'emploi et rappels utiles. */
function NothingSelected({ variables, readOnly }) {
  return (
    <div className="flex flex-col gap-6 px-5 py-8">
      <div className="flex flex-col items-center px-2 text-center">
        <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
          <MousePointerClick className="size-4.5" aria-hidden />
        </span>
        <p className="text-sm font-medium">
          {readOnly ? "Contenu en lecture seule" : "Sélectionnez un bloc"}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {readOnly
            ? "Ce contenu ne peut plus être modifié."
            : "Cliquez sur un bloc de l'e-mail pour modifier son contenu, ses couleurs et ses marges."}
        </p>
      </div>
      <div className="rounded-xl border border-[#EEEFF1] p-4 dark:border-[#232323]">
        <p className="text-[13px] font-medium">Personnalisation</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Insérez une variable dans vos textes et boutons : chaque contact
          reçoit l&apos;e-mail à son nom.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(variables?.length ? variables : DEFAULT_VARIABLES).map(
            (variable) => (
              <span
                key={variable.key}
                className="rounded-md bg-[#5a50ff]/10 px-1.5 py-0.5 font-mono text-[11px] text-[#4a41e0] dark:bg-[#8b7fff]/15 dark:text-[#c9c3ff]"
                title={`${variable.label}, par exemple ${variable.example}`}
              >
                {`{{${variable.key}}}`}
              </span>
            ),
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[#EEEFF1] p-4 dark:border-[#232323]">
        <p className="text-[13px] font-medium">Pied de page</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Le nom et l&apos;adresse de votre entreprise et le lien de
          désinscription sont ajoutés à chaque envoi : vous n&apos;avez rien à
          prévoir.
        </p>
      </div>
    </div>
  );
}

/**
 * Éditeur d'une campagne : barre du haut (retour, nom, enregistrement,
 * Annuler / Rétablir, aperçu, test, Terminer), blocs et style à gauche,
 * l'e-mail au centre, réglages du bloc sélectionné à droite.
 */
export function CampaignEditor({
  campaign,
  workspaceId,
  settings,
  companyName,
}) {
  const router = useRouter();
  const access = useCampaignAccess();
  const notDraft = campaign.status !== "DRAFT";
  const readOnly = notDraft || !access.canEdit || access.readOnly;
  // Refus d'enregistrement : expliqué une fois par message (pas à chaque frappe)
  const lastSaveError = useRef(null);
  const editor = useCampaignEditor({
    campaign,
    workspaceId,
    readOnly,
    onSaveError: (error) => {
      const message = errorMessage(error);
      if (message === lastSaveError.current) return;
      lastSaveError.current = message;
      toast.error("Modifications non enregistrées", { description: message });
    },
  });
  const { design, designRef, commit } = editor;
  const style = useMemo(() => resolvedStyle(design.style), [design.style]);
  const variables = settings?.variables;
  const locked = readOnly || editor.blocked;
  // Signatures et destinations des boutons (autres outils de l'espace)
  const campaignData = useCampaignDataValue(workspaceId, design);
  const signaturesRef = useRef(campaignData.signatures);
  signaturesRef.current = campaignData.signatures;
  /** Propriétés de départ d'un bloc : signature principale proposée d'office. */
  const startingProps = useCallback(
    (type) =>
      type === "signature"
        ? { signatureId: defaultSignatureId(signaturesRef.current) }
        : {},
    [],
  );

  const [tab, setTab] = useState("blocks");
  const [selectedId, setSelectedId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);
  const [dropIndex, setDropIndexState] = useState(null);
  const dropIndexRef = useRef(null);
  const canvasRef = useRef(null);
  // Texte à ouvrir au clavier : { id, point } (clic) ou { id, selectAll } (ajout)
  const focusRequest = useRef(null);
  const requestTextFocus = (block) => {
    if (RICH_TEXT_TYPES.includes(block.type)) {
      focusRequest.current = { id: block.id, selectAll: true };
    }
  };

  const selected = findBlock(design, selectedId);
  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selectedId, selected]);

  const setDropIndex = (value) => {
    dropIndexRef.current = value;
    setDropIndexState(value);
  };

  const scrollToBlock = (id) => {
    requestAnimationFrame(() => {
      const node = canvasRef.current?.querySelector(`[data-block-id="${id}"]`);
      node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  // ── Opérations sur le design ──────────────────────────────────────────
  /** Plus de place (80 blocs, limite de l'API) : expliqué, rien n'est ajouté. */
  const full = useCallback(() => {
    if ((designRef.current.blocks || []).length < MAX_BLOCKS) return false;
    toast.error(`Un e-mail ne peut pas contenir plus de ${MAX_BLOCKS} blocs`);
    return true;
  }, [designRef]);

  const handleAdd = useCallback(
    (type) => {
      if (locked || full()) return;
      const { design: next, block } = addBlock(
        designRef.current,
        type,
        selectedId,
        startingProps(type),
      );
      commit(next);
      setSelectedId(block.id);
      requestTextFocus(block);
      scrollToBlock(block.id);
    },
    [locked, full, designRef, selectedId, commit, startingProps],
  );

  const handleUpdate = useCallback(
    (id, patch, key) =>
      commit((current) => updateBlock(current, id, patch), {
        coalesce: key ? `${id}:${key}` : undefined,
      }),
    [commit],
  );

  const handleStyle = useCallback(
    (patch, key) =>
      commit((current) => updateStyle(current, patch), {
        coalesce: key ? `style:${key}` : undefined,
      }),
    [commit],
  );

  const handleMove = useCallback(
    (id, delta) => {
      commit((current) => moveBlockBy(current, id, delta));
      scrollToBlock(id);
    },
    [commit],
  );

  const handleDuplicate = useCallback(
    (id) => {
      if (full()) return;
      const { design: next, block } = duplicateBlock(designRef.current, id);
      if (!block) return;
      commit(next);
      setSelectedId(block.id);
      scrollToBlock(block.id);
    },
    [full, designRef, commit],
  );

  const handleRemove = useCallback(
    (id) => {
      const block = findBlock(designRef.current, id);
      if (!block) return;
      commit(removeBlock(designRef.current, id));
      setSelectedId((current) => (current === id ? null : current));
      toast.success(`Bloc « ${BLOCK_LABELS[block.type]} » supprimé`, {
        description: "Annulez avec ⌘ Z (Ctrl + Z) si c'était une erreur.",
      });
    },
    [designRef, commit],
  );

  // ── Clavier ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event) => {
      if (locked) return;
      const target = event.target;
      const key = (event.key || "").toLowerCase();
      const mod = event.metaKey || event.ctrlKey;
      const inText = target?.closest?.("[contenteditable='true']");
      const typing = target?.closest?.(
        "input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu'], [role='listbox']",
      );
      if (mod && (key === "z" || key === "y")) {
        // Les champs et le texte en cours d'édition gardent leur annulation
        if (typing) return;
        event.preventDefault();
        if (key === "y" || event.shiftKey) editor.redo();
        else editor.undo();
        return;
      }
      if (key === "escape" && inText) {
        inText.blur();
        return;
      }
      if (typing || !selectedId) return;
      if (key === "escape") {
        setSelectedId(null);
      } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        handleRemove(selectedId);
      } else if (mod && key === "d") {
        event.preventDefault();
        handleDuplicate(selectedId);
      } else if (event.altKey && (key === "arrowup" || key === "arrowdown")) {
        event.preventDefault();
        handleMove(selectedId, key === "arrowup" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, selectedId, editor, handleRemove, handleDuplicate, handleMove]);

  // ── Glisser-déposer ───────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Bloc de la palette : la toile entière reçoit, le pointeur décide de la
  // place ; déplacement d'un bloc : le plus proche
  const collisionDetection = useCallback((args) => {
    if (args.active.data.current?.source === "palette") {
      const hits = pointerWithin(args);
      return hits.filter((hit) => hit.id === "canvas");
    }
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => container.id !== "canvas",
      ),
    });
  }, []);

  /** Position d'insertion sous le pointeur, d'après le milieu des blocs. */
  const indexAt = (y) => {
    const nodes = canvasRef.current?.querySelectorAll("[data-block-id]") || [];
    let index = 0;
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (y > rect.top + rect.height / 2) index += 1;
      else break;
    }
    return index;
  };

  const onDragStart = ({ active }) => {
    setActiveDrag({ id: active.id, ...(active.data.current || {}) });
  };
  const onDragMove = (event) => {
    if (event.active.data.current?.source !== "palette") return;
    if (!event.over) {
      if (dropIndexRef.current !== null) setDropIndex(null);
      return;
    }
    const y = (event.activatorEvent?.clientY ?? 0) + event.delta.y;
    const next = indexAt(y);
    if (next !== dropIndexRef.current) setDropIndex(next);
  };
  const onDragEnd = ({ active, over }) => {
    const source = active.data.current?.source;
    if (source === "palette") {
      const index = dropIndexRef.current;
      if (over && index !== null && !locked && !full()) {
        const type = active.data.current.type;
        const block = createBlock(type, startingProps(type));
        commit(insertBlock(designRef.current, block, index));
        setSelectedId(block.id);
        requestTextFocus(block);
      }
    } else if (over && active.id !== over.id) {
      const from = findBlockIndex(designRef.current, active.id);
      const to = findBlockIndex(designRef.current, over.id);
      if (from >= 0 && to >= 0) commit(moveBlock(designRef.current, from, to));
    }
    setActiveDrag(null);
    setDropIndex(null);
  };
  const onDragCancel = () => {
    setActiveDrag(null);
    setDropIndex(null);
  };

  // ── Sortie, test ──────────────────────────────────────────────────────
  const leave = async () => {
    const ok = await editor.flush();
    if (!ok && !editor.blocked && !readOnly) {
      setConfirmLeave(true);
      return;
    }
    router.push(campaignUrl(campaign.id));
  };

  const beforeTest = async () => {
    const ok = await editor.flush();
    if (!ok) {
      toast.error("Vos dernières modifications ne sont pas enregistrées", {
        description:
          "L'e-mail de test n'a pas été envoyé. Réessayez dans un instant.",
      });
    }
    return ok;
  };

  const undoLabel = "Annuler (⌘ Z)";
  const redoLabel = "Rétablir (⇧ ⌘ Z)";

  const content = (
    <div
      lang="fr"
      className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      {/* Barre du haut */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#EEEFF1] px-3 dark:border-[#232323]">
        <Button
          variant="ghost"
          size="icon"
          className={cn("shrink-0", FOCUS_RING)}
          onClick={leave}
          aria-label="Retour à la campagne"
          title="Retour à la campagne"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            value={editor.name}
            onChange={(event) => editor.setName(event.target.value)}
            disabled={locked}
            maxLength={120}
            aria-label="Nom de la campagne"
            className="h-8 min-w-0 max-w-[340px] flex-1 truncate rounded-md border border-transparent bg-transparent px-2 text-[15px] font-medium outline-none hover:border-[#e6e7ea] focus:border-[#D1D3D8] disabled:hover:border-transparent dark:hover:border-[#2E2E32] dark:focus:border-[#44444A]"
          />
          <SaveStatus
            status={editor.status}
            onRetry={editor.blocked ? undefined : editor.retry}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!locked && (
            <div className="mr-1 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={FOCUS_RING}
                onClick={editor.undo}
                disabled={!editor.canUndo}
                aria-label={undoLabel}
                title={undoLabel}
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={FOCUS_RING}
                onClick={editor.redo}
                disabled={!editor.canRedo}
                aria-label={redoLabel}
                title={redoLabel}
              >
                <Redo2 className="size-4" />
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className={FOCUS_RING}
          >
            <Eye className="size-3.5" aria-hidden />
            Aperçu
          </Button>
          {(access.canEdit || access.canSend) && !access.readOnly && (
            <Button
              variant="outline"
              onClick={() => setTestOpen(true)}
              className={FOCUS_RING}
            >
              <MailCheck className="size-3.5" aria-hidden />
              <span className="hidden lg:inline">Envoyer un test</span>
              <span className="lg:hidden">Tester</span>
            </Button>
          )}
          <Button variant="primary" onClick={leave} className={FOCUS_RING}>
            <Check className="size-3.5" aria-hidden />
            Terminer
          </Button>
        </div>
      </div>

      {(notDraft || editor.blocked || (readOnly && !notDraft)) && (
        <div
          role="status"
          className={cn(
            "shrink-0 border-b px-4 py-2 text-sm",
            editor.blocked
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
              : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
          )}
        >
          {editor.blocked
            ? `Vos dernières modifications n'ont pas été enregistrées : ${errorMessage(editor.saveError)}`
            : notDraft
              ? "Cette campagne n'est plus un brouillon : son contenu ne peut plus être modifié. Pour la changer, annulez la programmation ou dupliquez-la."
              : access.readOnly
                ? `${access.readOnlyReason}.`
                : "Votre rôle permet de consulter ce contenu, pas de le modifier."}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        modifiers={
          activeDrag?.source === "canvas" ? [restrictToVerticalAxis] : []
        }
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex min-h-0 flex-1">
          {/* Panneau gauche : blocs et style */}
          <aside className="flex w-[272px] shrink-0 flex-col border-r border-[#EEEFF1] xl:w-[288px] dark:border-[#232323]">
            <TabsNew
              value={tab}
              onValueChange={setTab}
              className="min-h-0 flex-1"
            >
              <TabsNewList className="pt-3">
                <TabsNewTrigger value="blocks" className={FOCUS_RING}>
                  <Blocks className="size-3.5" aria-hidden />
                  Blocs
                </TabsNewTrigger>
                <TabsNewTrigger value="style" className={FOCUS_RING}>
                  <Palette className="size-3.5" aria-hidden />
                  Style
                </TabsNewTrigger>
              </TabsNewList>
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto",
                  locked && "pointer-events-none opacity-60",
                )}
                inert={locked}
              >
                <TabsNewContent value="blocks">
                  <BlocksPanel onAdd={handleAdd} disabled={locked} />
                </TabsNewContent>
                <TabsNewContent value="style">
                  <StylePanel style={style} onChange={handleStyle} />
                </TabsNewContent>
              </div>
            </TabsNew>
          </aside>

          {/* Toile */}
          <main
            className="relative min-w-0 flex-1 overflow-y-auto"
            aria-label="Contenu de l'e-mail"
          >
            <EditorCanvas
              design={design}
              style={style}
              selectedId={selectedId}
              dropIndex={dropIndex}
              paletteDragging={activeDrag?.source === "palette"}
              readOnly={locked}
              variables={variables}
              companyName={companyName}
              companyAddress={settings?.companyAddress}
              trackingNotice={{
                opens: campaign.trackOpens,
                clicks: campaign.trackClicks,
                privacyPolicyUrl: campaign.privacyPolicyUrl,
              }}
              canvasRef={canvasRef}
              focusRequest={focusRequest}
              onSelect={setSelectedId}
              onDeselect={() => setSelectedId(null)}
              onUpdate={handleUpdate}
              onMove={handleMove}
              onDuplicate={handleDuplicate}
              onRemove={handleRemove}
            />
          </main>

          {/* Panneau droit : réglages du bloc */}
          <aside className="flex w-[300px] shrink-0 flex-col border-l border-[#EEEFF1] xl:w-[320px] dark:border-[#232323]">
            {selected && !locked ? (
              <BlockSettings
                key={selected.id}
                block={selected}
                style={style}
                workspaceId={workspaceId}
                variables={variables}
                onUpdate={(patch, key) => handleUpdate(selected.id, patch, key)}
                onDuplicate={() => handleDuplicate(selected.id)}
                onRemove={() => handleRemove(selected.id)}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NothingSelected variables={variables} readOnly={locked} />
              </div>
            )}
          </aside>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag?.source === "palette" ? (
            <BlockTilePreview type={activeDrag.type} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        workspaceId={workspaceId}
        campaignId={campaign.id}
        design={design}
        subject={campaign.subject}
        preheader={campaign.preheader}
        fromName={campaign.fromName}
        senderEmail={effectiveSenderEmail(campaign, settings)}
        variables={variables}
      />
      <TestEmailDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        workspaceId={workspaceId}
        campaignId={campaign.id}
        sendMode={settings?.sendMode}
        variables={variables}
        beforeSend={beforeTest}
      />

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter sans enregistrer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vos dernières modifications n&apos;ont pas pu être enregistrées
              (connexion interrompue ?). Si vous quittez maintenant, elles
              seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester sur la page</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(campaignUrl(campaign.id))}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <CampaignDataProvider value={campaignData}>{content}</CampaignDataProvider>
  );
}
