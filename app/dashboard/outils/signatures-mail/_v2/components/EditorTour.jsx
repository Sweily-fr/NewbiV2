"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";

const STORAGE_KEY = "sig-editor-tour-v1";

/**
 * Guide de première ouverture de l'éditeur : quelques bulles posées sur les
 * zones clés (repérées par `data-tour`), montrées une seule fois par
 * navigateur. Passer ou terminer le ferme définitivement.
 */
export default function EditorTour({ steps }) {
  const [index, setIndex] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ? -1 : 0;
    } catch {
      return -1;
    }
  });
  const [rect, setRect] = useState(null);
  const step = index >= 0 ? steps[index] : null;

  useEffect(() => {
    if (!step) return undefined;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    // L'aperçu se charge et change de hauteur : on suit sa position
    const timer = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Stockage indisponible : le guide reviendra à la prochaine visite
    }
    setIndex(-1);
  };

  if (!step || !rect) return null;
  const last = index === steps.length - 1;
  // Grande zone (aperçu) : bulle dans son coin bas droit, là où la
  // signature (alignée à gauche) laisse de la place ; petite zone
  // (boutons) : bulle juste en dessous, alignée à droite
  const large = rect.height > 160;
  const width = 320;
  const left = Math.min(
    Math.max(16, rect.right - width - (large ? 24 : 0)),
    window.innerWidth - width - 16,
  );
  const position = large
    ? { bottom: Math.max(16, window.innerHeight - rect.bottom + 24) }
    : { top: rect.bottom + 12 };

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed z-50 rounded-xl ring-2 ring-[#5b4fff] ring-offset-2 ring-offset-background transition-all duration-200"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
      <div
        role="dialog"
        aria-label={step.title}
        className="fixed z-50 rounded-xl border bg-background p-4 shadow-lg"
        style={{ ...position, left, width }}
      >
        <p className="text-sm font-medium">{step.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {index + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {!last && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={finish}
              >
                Passer
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="cursor-pointer"
              onClick={() => (last ? finish() : setIndex(index + 1))}
            >
              {last ? "C'est parti" : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
