"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

// Carte « Le ticket de caisse froissé devient une dépense propre » : à gauche
// un ticket de caisse (papier étroit, bord dentelé, monospace), à droite trois
// puces qui en sont extraites (fournisseur, TTC, TVA) puis un check « Classée ».
// Le tout ancré en bas à gauche, le ticket dépassant du bord de la carte.
export default function ReceiptScanAnimation() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
      // Le ticket arrive froissé (plis + ombres visibles, papier gondolé),
      // puis se défroisse à plat avant la lecture
      tl.fromTo(
        ".t-ticket",
        { y: 30, opacity: 0, rotation: -6, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          rotation: -3,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
        },
      );
      tl.to(
        ".t-crease",
        { opacity: 0, duration: 0.9, ease: "power2.inOut" },
        "+=0.5",
      );
      tl.to(
        ".t-paper",
        { skewX: 0, skewY: 0, rotateX: 0, duration: 0.9, ease: "power2.inOut" },
        "<",
      );
      // Balayage de lecture sur le ticket
      tl.fromTo(
        ".t-scan",
        { top: "4%", opacity: 0 },
        { top: "96%", opacity: 1, duration: 1, ease: "power1.inOut" },
        "+=0.3",
      );
      tl.to(".t-scan", { opacity: 0, duration: 0.2 });
      // Lignes du ticket surlignées puis puces extraites
      tl.to(
        ".t-hl",
        {
          backgroundColor: "rgba(90,80,255,0.12)",
          duration: 0.2,
          stagger: 0.15,
        },
        "-=0.7",
      );
      tl.fromTo(
        ".t-chip",
        { x: -14, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, stagger: 0.15, ease: "power2.out" },
        "<0.1",
      );
      tl.fromTo(
        ".t-done",
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.8)" },
        "+=0.2",
      );
      tl.to({}, { duration: 2.4 });
      tl.to([".t-ticket", ".t-chip", ".t-done"], {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
      tl.set(".t-hl", { backgroundColor: "rgba(90,80,255,0)" });
      tl.set(".t-crease", { opacity: 1 });
      tl.set(".t-paper", { skewX: -2, skewY: 1.5, rotateX: 8 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {/* Ticket papier, ancré en bas à gauche */}
      <div className="t-ticket absolute left-5 md:left-8 -bottom-4 w-[150px] opacity-0 origin-bottom [perspective:600px]">
        <div
          className="t-paper relative bg-white border border-neutral-200/80 shadow-[0_-2px_12px_-6px_rgba(0,0,0,0.08)] px-4 pt-4 pb-6 font-mono text-[10px] leading-relaxed text-neutral-700 origin-bottom"
          style={{
            transform: "skew(-2deg, 1.5deg) rotateX(8deg)",
            clipPath:
              "polygon(0 0, 100% 0, 100% 100%, 92% 96%, 84% 100%, 76% 96%, 68% 100%, 60% 96%, 52% 100%, 44% 96%, 36% 100%, 28% 96%, 20% 100%, 12% 96%, 4% 100%, 0 96%)",
          }}
        >
          {/* Plis du papier froissé (ombres diagonales), effacés au défroissage */}
          <div
            className="t-crease pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, transparent 18%, rgba(0,0,0,0.07) 24%, transparent 30%), linear-gradient(62deg, transparent 40%, rgba(0,0,0,0.06) 47%, transparent 53%), linear-gradient(128deg, transparent 62%, rgba(0,0,0,0.08) 70%, transparent 76%), linear-gradient(70deg, transparent 78%, rgba(0,0,0,0.05) 84%, transparent 90%)",
            }}
          />
          <div className="t-scan pointer-events-none absolute left-0 right-0 h-px bg-[#5A50FF] opacity-0 shadow-[0_0_10px_2px_rgba(90,80,255,0.35)]" />
          <p className="t-hl rounded px-0.5 -mx-0.5 font-semibold text-neutral-900 tracking-wide">
            LEROY MERLIN
          </p>
          <p className="text-neutral-400">12/09/2026 · 14:02</p>
          <div className="my-2 border-t border-dashed border-neutral-300" />
          <div className="flex justify-between">
            <span>Vis 4x40</span>
            <span>12,90</span>
          </div>
          <div className="flex justify-between">
            <span>Perceuse</span>
            <span>59,00</span>
          </div>
          <div className="flex justify-between">
            <span>Chevilles</span>
            <span>14,50</span>
          </div>
          <div className="my-2 border-t border-dashed border-neutral-300" />
          <div className="t-hl rounded px-0.5 -mx-0.5 flex justify-between font-semibold text-neutral-900">
            <span>TOTAL TTC</span>
            <span>86,40</span>
          </div>
          <div className="t-hl rounded px-0.5 -mx-0.5 flex justify-between">
            <span>dont TVA 20%</span>
            <span>14,40</span>
          </div>
        </div>
      </div>

      {/* Données extraites, à droite du ticket */}
      <div className="absolute left-[185px] md:left-[205px] bottom-10 flex flex-col items-start gap-2">
        {[
          ["Fournisseur", "Leroy Merlin"],
          ["TTC", "86,40 €"],
          ["TVA", "14,40 €"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="t-chip opacity-0 flex items-center gap-2 rounded-lg bg-white border border-neutral-200/80 px-2.5 py-1.5 text-[11px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <span className="text-neutral-500">{k}</span>
            <span className="font-medium text-neutral-900">{v}</span>
          </div>
        ))}
        <div className="t-done opacity-0 mt-1 flex items-center gap-1.5 text-[11px] font-medium text-green-700">
          <span className="flex size-4 items-center justify-center rounded-full bg-green-600 text-white">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          Classée · Fournitures
        </div>
      </div>
    </div>
  );
}
