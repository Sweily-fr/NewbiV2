"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { RENDER_SIGNATURE_V2, toInput } from "../graphql";
import HtmlFrame from "./HtmlFrame";

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
export default function SignaturePreview({ id, sig, initialRender, onRender }) {
  const [dark, setDark] = useState(false);
  const input = useMemo(() => toInput(sig), [sig]);
  const debouncedInput = useDebounced(input, RENDER_DELAY_MS);
  const lastRender = useRef(initialRender);

  const { data } = useQuery(RENDER_SIGNATURE_V2, {
    variables: { id, input: debouncedInput },
    skip: !sig,
    fetchPolicy: "no-cache",
  });

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
          {dark
            ? "Simulation du mode sombre (Apple Mail, Outlook) : les textes sombres sont inversés, pas les images."
            : "Aperçu identique au HTML copié, sans aucun style de l'application."}
        </p>
        <ToggleGroup
          type="single"
          size="sm"
          value={dark ? "dark" : "light"}
          onValueChange={(v) => v && setDark(v === "dark")}
        >
          <ToggleGroupItem value="light" aria-label="Aperçu clair" className="px-2.5">
            <Sun size={14} />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Aperçu sombre" className="px-2.5">
            <Moon size={14} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Fenêtre de client mail stylisée autour de l'iframe */}
      <div
        className={`flex-1 overflow-hidden rounded-xl border shadow-sm ${
          dark ? "border-neutral-700 bg-[#1f1f1f]" : "border-neutral-200 bg-white"
        }`}
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
          <div className={`border-b py-1.5 ${dark ? "border-neutral-700" : "border-neutral-100"}`}>
            À : <span className={dark ? "text-neutral-200" : "text-neutral-700"}>Votre client</span>
          </div>
          <div className={`border-b py-1.5 ${dark ? "border-neutral-700" : "border-neutral-100"}`}>
            Objet :{" "}
            <span className={dark ? "text-neutral-200" : "text-neutral-700"}>Suite à notre échange</span>
          </div>
          <p className={`py-3 text-sm ${dark ? "text-neutral-200" : "text-neutral-700"}`}>
            Bonjour,
            <br />
            Merci pour votre message, je reviens vers vous très vite.
            <br />
            Bien à vous,
          </p>
        </div>
        <HtmlFrame
          html={render?.html || ""}
          dark={dark}
          padding={16}
          className="h-[calc(100%-150px)] w-full border-0"
          title="Aperçu de la signature"
        />
      </div>
    </div>
  );
}
