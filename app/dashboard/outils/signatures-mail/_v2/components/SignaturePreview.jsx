"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  ArrowUpToLine,
  CircleHelp,
  Delete,
  GripVertical,
  Monitor,
  Moon,
  MousePointerClick,
  Scaling,
  Smartphone,
  Sun,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { RENDER_SIGNATURE_V2, toInput } from "../graphql";
import { modClick } from "./LevelPanels";
import HtmlFrame from "./HtmlFrame";
import DropOverlay from "./DropOverlay";

// Court : un déplacement ou un réglage doit se voir tout de suite
const RENDER_DELAY_MS = 150;

/** Les gestes de l'aperçu, rappelés au-dessus de lui. */
const GESTURES = [
  { icon: MousePointerClick, label: "Cliquer pour modifier" },
  { icon: ArrowUpToLine, label: () => `${modClick()} pour le niveau au-dessus` },
  { icon: GripVertical, label: "Poignée pour déplacer" },
  { icon: Scaling, label: "Bord ou coin pour agrandir" },
  { icon: Delete, label: "Suppr (⌫) pour retirer l'élément sélectionné" },
];

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
  // Échap pendant le glisser, pointeur dans l'aperçu
  const cancelDrag = useCallback(() => setDrag(null), []);
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
        {mobile && overflow ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Trop large pour un téléphone : la signature y défilera de côté.
            Placez des éléments en dessous plutôt qu&apos;à côté.
          </p>
        ) : dark ? (
          <p className="text-xs text-muted-foreground">
            Simulation du mode sombre (Apple Mail, Outlook) : les textes
            sombres sont inversés, pas les images.
          </p>
        ) : readOnly ? (
          <span />
        ) : (
          // Une phrase pour commencer ; les autres gestes dans l'aide « ? »
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <MousePointerClick size={14} aria-hidden="true" />
            <span className="truncate">Cliquez un élément pour le modifier</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Tous les gestes de l'aperçu"
                  title="Tous les gestes de l'aperçu"
                  className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  <CircleHelp size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-3">
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
              </PopoverContent>
            </Popover>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            value={mobile ? "mobile" : "desktop"}
            onValueChange={(v) => v && setMobile(v === "mobile")}
          >
            <ToggleGroupItem
              value="desktop"
              aria-label="Aperçu ordinateur"
              title="Aperçu sur ordinateur"
              className="px-2.5"
            >
              <Monitor size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="mobile"
              aria-label="Aperçu téléphone"
              title="Aperçu sur téléphone"
              className="px-2.5"
            >
              <Smartphone size={14} />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            size="sm"
            value={dark ? "dark" : "light"}
            onValueChange={(v) => v && setDark(v === "dark")}
          >
            <ToggleGroupItem
              value="light"
              aria-label="Aperçu clair"
              title="Mode clair"
              className="px-2.5"
            >
              <Sun size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dark"
              aria-label="Aperçu sombre"
              title="Mode sombre"
              className="px-2.5"
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
          frozen={editing}
        />
        {drag && (
          <DropOverlay
            drag={drag}
            style={sig.style}
            pointer={dragPointer}
            release={dragRelease}
            scroller={scrollRef}
            onCancel={() => setDrag(null)}
            onDrop={(patch, info) => {
              setDrag(null);
              onStylePatch?.(patch, info);
            }}
          />
        )}
      </div>
    </div>
  );
}
