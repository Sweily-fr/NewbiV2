"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  ArrowUpToLine,
  CircleHelp,
  CornerDownLeft,
  Delete,
  GripVertical,
  Monitor,
  Moon,
  MousePointerClick,
  MoveHorizontal,
  Scaling,
  Smartphone,
  SquareDashedMousePointer,
  Sun,
  Undo2,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { RENDER_SIGNATURE_V2, toInput } from "../graphql";
import { modClick, undoKeys } from "./LevelPanels";
import { FOCUS_RING } from "./controls";
import HtmlFrame from "./HtmlFrame";
import DropOverlay from "./DropOverlay";

// Court : un déplacement ou un réglage doit se voir tout de suite
const RENDER_DELAY_MS = 150;

// Modes de l'aperçu en segments, comme les choix des panneaux : pastille
// blanche et icône foncée pour le mode actif, sur une piste qui tranche
// sur le fond de l'aperçu ; icône grise pour l'autre mode
const MODE_GROUP =
  "gap-0.5 rounded-[9px] bg-neutral-200/70 p-0.5 dark:bg-neutral-800";
const MODE_ITEM = `h-7 rounded-md px-2.5 text-[#606164] hover:bg-transparent hover:text-[#242529] focus-visible:ring-0 dark:text-white/55 dark:hover:text-white data-[state=on]:bg-white data-[state=on]:text-[#242529] data-[state=on]:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] dark:data-[state=on]:bg-neutral-600 dark:data-[state=on]:text-white ${FOCUS_RING}`;

/** Les gestes de l'aperçu, rappelés au-dessus de lui. */
const GESTURES = [
  { icon: MousePointerClick, label: "Cliquer pour modifier" },
  { icon: ArrowUpToLine, label: () => `${modClick()} pour le niveau au-dessus` },
  { icon: GripVertical, label: "Poignée pour déplacer" },
  { icon: MoveHorizontal, label: "Bord droit pour changer la largeur" },
  { icon: Scaling, label: "Coin pour changer la taille du texte" },
  {
    icon: CornerDownLeft,
    label: "Entrée ou Échap pour valider un texte modifié",
  },
  {
    icon: SquareDashedMousePointer,
    label: "Échap ou clic à côté pour désélectionner",
  },
  { icon: Delete, label: "Suppr (⌫) pour retirer l'élément sélectionné" },
  {
    icon: Undo2,
    label: () => {
      const keys = undoKeys();
      return `${keys.undo} pour annuler, ${keys.redo} pour rétablir`;
    },
  },
];

/**
 * Aide « ? » : tous les gestes de l'aperçu. Toujours au même endroit, y
 * compris en aperçu sombre ou sur téléphone, où l'aperçu reste modifiable.
 * `onReplayTour` : relance la visite guidée.
 */
function GesturesHelp({ onReplayTour }) {
  const [open, setOpen] = useState(false);
  // La visite relancée prend le focus : l'aide qui se ferme ne le rend pas
  // à son bouton
  const replaying = useRef(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Tous les gestes de l'aperçu"
          title="Tous les gestes de l'aperçu"
          className={`ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer ${FOCUS_RING}`}
        >
          <CircleHelp size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-3"
        onCloseAutoFocus={(e) => {
          if (!replaying.current) return;
          replaying.current = false;
          e.preventDefault();
        }}
      >
        <p className="mb-2 text-sm font-medium">Dans l&apos;aperçu</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {GESTURES.map(({ icon: Icon, label }) => {
            const text = typeof label === "function" ? label() : label;
            return (
              <li key={text} className="flex items-start gap-2">
                <Icon size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                {text}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          Tout se règle aussi à gauche : onglet Style, rubrique « Un élément
          en particulier ».
        </p>
        {onReplayTour && (
          <button
            type="button"
            onClick={() => {
              replaying.current = true;
              setOpen(false);
              onReplayTour();
            }}
            className={`mt-2 rounded-sm text-xs font-medium text-[#5b4fff] hover:underline dark:text-[#8b7fff] cursor-pointer ${FOCUS_RING}`}
          >
            Revoir la visite guidée
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Aperçu en direct : le HTML vient de l'API (générateur unique), rendu dans
 * une iframe isolée, avec une simulation du mode sombre des clients mail.
 * Le dernier rendu reste affiché pendant le calcul du suivant.
 */
export default function SignaturePreview({
  id,
  sig,
  initialRender,
  onRender,
  onFieldClick,
  onTextInput,
  onStylePatch,
  onHistory,
  selection,
  onResize,
  onFont,
  onEscape,
  onDelete,
  onMeasure,
  onReplayTour,
  readOnly = false,
}) {
  const [dark, setDark] = useState(false);
  // Largeur d'un téléphone : pour vérifier que la signature s'adapte
  const [mobile, setMobile] = useState(false);
  const [overflow, setOverflow] = useState(false);
  // Texte en cours de modification dans l'aperçu : l'iframe n'est pas
  // rechargée tant que la frappe n'est pas validée
  const [editing, setEditing] = useState(false);
  // Bloc en cours de déplacement (zones de dépôt affichées), avec la
  // position et le relâchement relayés par l'aperçu
  const [drag, setDrag] = useState(null);
  const [dragPointer, setDragPointer] = useState(null);
  const [dragRelease, setDragRelease] = useState(null);
  const startDrag = useCallback((d) => {
    setDragPointer(null);
    setDragRelease(null);
    setDrag(d);
  }, []);
  // Fin d'un glisser (dépôt ou abandon) : le clic que le navigateur peut
  // émettre juste après ne doit pas désélectionner
  const dropped = useRef(false);
  const endDrag = useCallback(() => {
    dropped.current = true;
    setTimeout(() => {
      dropped.current = false;
    }, 0);
    setDrag(null);
  }, []);
  // Échap pendant le glisser, pointeur dans l'aperçu
  const cancelDrag = endDrag;
  // Clic à côté de la signature (en-tête du faux message, sous l'aperçu) :
  // la sélection est retirée
  const onWindowClick = (e) => {
    if (drag || dropped.current || e.target.closest?.("button, a, input")) return;
    onEscape?.();
  };
  // Conteneur qui défile (faux message et aperçu)
  const scrollRef = useRef(null);
  const input = useMemo(() => toInput(sig), [sig]);
  const debouncedInput = useDebounced(input, RENDER_DELAY_MS);
  const lastRender = useRef(initialRender);

  const { data, refetch } = useQuery(RENDER_SIGNATURE_V2, {
    variables: { id, input: debouncedInput },
    skip: !sig,
    fetchPolicy: "no-cache",
  });

  // Les images ne font pas partie de l'entrée (elles vivent sur le document) :
  // après un envoi ou un retrait, on force un nouveau rendu.
  const imagesKey = JSON.stringify(sig?.images || null);
  const firstImagesKey = useRef(imagesKey);
  useEffect(() => {
    if (imagesKey !== firstImagesKey.current) {
      firstImagesKey.current = imagesKey;
      refetch();
    }
  }, [imagesKey, refetch]);

  const render = data?.renderEmailSignatureV2 || lastRender.current;
  useEffect(() => {
    if (data?.renderEmailSignatureV2) {
      lastRender.current = data.renderEmailSignatureV2;
      onRender?.(data.renderEmailSignatureV2);
    }
  }, [data, onRender]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 px-1 pb-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {mobile && overflow ? (
            // Les textes et les largeurs choisies se resserrent sur un
            // téléphone : seuls les éléments côte à côte (logo, réseaux)
            // peuvent encore déborder
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Trop large pour un téléphone : la signature y défilera de côté.
              Mettez le logo sous les réseaux, ou répartissez les réseaux sur
              deux lignes.
            </p>
          ) : dark ? (
            <p className="text-xs text-muted-foreground">
              Simulation du mode sombre (Apple Mail, Outlook) : les textes
              sombres sont inversés, pas les images.
            </p>
          ) : readOnly ? null : (
            // Une phrase pour commencer ; les autres gestes dans l'aide « ? »
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <MousePointerClick size={14} aria-hidden="true" />
              <span className="truncate">
                Cliquez sur un élément pour le modifier
              </span>
            </div>
          )}
          {!readOnly && <GesturesHelp onReplayTour={onReplayTour} />}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            className={MODE_GROUP}
            value={mobile ? "mobile" : "desktop"}
            onValueChange={(v) => v && setMobile(v === "mobile")}
          >
            <ToggleGroupItem
              value="desktop"
              aria-label="Aperçu ordinateur"
              title="Aperçu sur ordinateur"
              className={MODE_ITEM}
            >
              <Monitor size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="mobile"
              aria-label="Aperçu téléphone"
              title="Aperçu sur téléphone"
              className={MODE_ITEM}
            >
              <Smartphone size={14} />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            size="sm"
            className={MODE_GROUP}
            value={dark ? "dark" : "light"}
            onValueChange={(v) => v && setDark(v === "dark")}
          >
            <ToggleGroupItem
              value="light"
              aria-label="Aperçu clair"
              title="Mode clair"
              className={MODE_ITEM}
            >
              <Sun size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dark"
              aria-label="Aperçu sombre"
              title="Mode sombre"
              className={MODE_ITEM}
            >
              <Moon size={14} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Fenêtre de client mail stylisée autour de l'iframe ; elle défile
          quand la signature dépasse la hauteur disponible, y compris
          pendant un glisser (le calque de dépôt la fait défiler). */}
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 overflow-y-auto rounded-xl border shadow-sm ${
          mobile ? "mx-auto w-full max-w-[390px]" : ""
        } ${dark ? "border-neutral-700 bg-[#1f1f1f]" : "border-neutral-200 bg-white"}`}
        onClick={onWindowClick}
      >
        <div
          className={`flex items-center gap-2 border-b px-4 py-2 text-xs ${
            dark
              ? "border-neutral-700 bg-[#2a2a2a] text-neutral-300"
              : "border-neutral-200 bg-neutral-50 text-neutral-500"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3">Nouveau message</span>
        </div>
        <div
          className={`px-4 pt-3 text-xs ${dark ? "text-neutral-400" : "text-neutral-400"}`}
        >
          <div
            className={`border-b py-1.5 ${dark ? "border-neutral-700" : "border-neutral-100"}`}
          >
            À :{" "}
            <span className={dark ? "text-neutral-200" : "text-neutral-700"}>
              Votre client
            </span>
          </div>
          <div
            className={`border-b py-1.5 ${dark ? "border-neutral-700" : "border-neutral-100"}`}
          >
            Objet :{" "}
            <span className={dark ? "text-neutral-200" : "text-neutral-700"}>
              Suite à notre échange
            </span>
          </div>
          <p
            className={`py-3 text-sm ${dark ? "text-neutral-200" : "text-neutral-700"}`}
          >
            Bonjour,
            <br />
            Merci pour votre message, je reviens vers vous très vite.
            <br />
            Bien à vous,
          </p>
        </div>
        <HtmlFrame
          html={render?.previewHtml || render?.html || ""}
          dark={dark}
          padding={16}
          className="block min-h-[120px] w-full border-0"
          title="Aperçu de la signature"
          onFieldClick={onFieldClick}
          onTextInput={onTextInput}
          onEditingChange={setEditing}
          onDragStart={readOnly ? undefined : startDrag}
          onHistory={onHistory}
          onOverflow={setOverflow}
          selection={selection}
          onResize={readOnly ? undefined : onResize}
          onFont={readOnly ? undefined : onFont}
          onEscape={onEscape}
          onDelete={readOnly ? undefined : onDelete}
          readOnly={readOnly}
          onDragMove={setDragPointer}
          onDragEnd={setDragRelease}
          onDragCancel={cancelDrag}
          onMeasure={onMeasure}
          frozen={editing}
        />
        {drag && (
          <DropOverlay
            drag={drag}
            style={sig.style}
            pointer={dragPointer}
            release={dragRelease}
            scroller={scrollRef}
            onCancel={endDrag}
            onDrop={(patch, info) => {
              endDrag();
              onStylePatch?.(patch, info);
            }}
          />
        )}
      </div>
    </div>
  );
}
