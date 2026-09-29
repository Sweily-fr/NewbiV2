"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { RENDER_SIGNATURE_V2, toInput } from "../graphql";
import HtmlFrame from "./HtmlFrame";
import DropOverlay from "./DropOverlay";

const RENDER_DELAY_MS = 250;

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
      <div className="flex items-center justify-between px-1 pb-3">
        <p className="text-xs text-muted-foreground">
          {mobile && overflow ? (
            <span className="text-amber-700 dark:text-amber-300">
              Trop large pour un téléphone : la signature y défilera de côté.
              Placez des éléments en dessous plutôt qu&apos;à côté.
            </span>
          ) : dark ? (
            "Simulation du mode sombre (Apple Mail, Outlook) : les textes sombres sont inversés, pas les images."
          ) : (
            "Cliquez sur un texte pour le modifier. Pour déplacer un bloc, tirez sa poignée ⠿ (au survol)."
          )}
        </p>
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
              className="px-2.5"
            >
              <Monitor size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="mobile"
              aria-label="Aperçu téléphone"
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
              className="px-2.5"
            >
              <Sun size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dark"
              aria-label="Aperçu sombre"
              className="px-2.5"
            >
              <Moon size={14} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Fenêtre de client mail stylisée autour de l'iframe ; elle défile
          quand la signature dépasse la hauteur disponible. */}
      <div
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
          readOnly={readOnly}
          onDragMove={setDragPointer}
          onDragEnd={setDragRelease}
          frozen={editing}
        />
        {drag && (
          <DropOverlay
            drag={drag}
            style={sig.style}
            pointer={dragPointer}
            release={dragRelease}
            onCancel={() => setDrag(null)}
            onDrop={(patch) => {
              setDrag(null);
              onStylePatch?.(patch);
            }}
          />
        )}
      </div>
    </div>
  );
}
