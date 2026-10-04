"use client";

import { useEffect, useRef } from "react";
import { ColorPicker } from "@/src/components/ui/color-picker";

const norm = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

/**
 * Sélecteur de couleur de l'éditeur de signature, à l'allure de celui des
 * paramètres de facture : pastille + code, en pleine largeur.
 *
 * Le ColorPicker partagé émet un onChange au montage (conversion HSV puis
 * retour en hex, avec une dérive d'un ou deux points de couleur) et affiche
 * cette couleur dérivée. Sans garde, ouvrir l'onglet Style enregistrait une
 * signature « modifiée ». On n'accepte donc un changement qu'après une
 * interaction réelle ; le champ visible affiche la vraie valeur, et le
 * déclencheur du ColorPicker, transparent, le recouvre pour ouvrir le
 * sélecteur.
 */
export default function ColorField({
  value,
  onChange,
  label,
  align = "start",
  side = "bottom",
}) {
  const interacted = useRef(false);
  const wrapper = useRef(null);
  const hex = norm(value);

  // Le déclencheur du ColorPicker porterait la couleur dérivée comme nom :
  // les lecteurs d'écran annoncent le libellé et la vraie valeur
  useEffect(() => {
    const trigger = wrapper.current?.querySelector("button");
    if (trigger) {
      trigger.setAttribute(
        "aria-label",
        `${label ? `${label} : ` : "Couleur "}${hex || "aucune"}`,
      );
    }
  });

  const handleChange = (next) => {
    if (!interacted.current) return;
    if (norm(next) === hex) return;
    onChange(norm(next));
  };

  return (
    <div
      ref={wrapper}
      className="group relative w-full"
      onPointerDownCapture={() => {
        interacted.current = true;
      }}
      onKeyDownCapture={() => {
        interacted.current = true;
      }}
    >
      {/* Le déclencheur, invisible, a le focus : l'anneau est dessiné ici,
          le même que sur les autres réglages de l'éditeur */}
      <div
        aria-hidden
        className="pointer-events-none flex h-8 w-full items-center gap-2 rounded-[9px] border border-[#e6e7ea] px-2.5 transition-[border,box-shadow] duration-[80ms] group-hover:border-[#D1D3D8] group-has-[:focus-visible]:outline-solid group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-[#5a50ff] dark:border-[#2E2E32] dark:group-hover:border-[#44444A] dark:group-has-[:focus-visible]:outline-[#8b7fff]"
      >
        <span
          className="h-4 w-4 shrink-0 rounded border border-black/10 dark:border-white/15"
          style={{ backgroundColor: hex || "transparent" }}
        />
        <span className="font-mono text-xs uppercase text-[#242529] dark:text-white">
          {hex.replace("#", "")}
        </span>
      </div>
      <ColorPicker
        color={value}
        onChange={handleChange}
        align={align}
        side={side}
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
