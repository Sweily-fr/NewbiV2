"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const MENTION = "TVA non applicable, art. L. 223-3 du CIBS";

// Carte « Ce que la loi te demande » (version auto-entrepreneur) : une
// mini-facture dont le pied de page s'écrit tout seul avec la mention de
// franchise en base, validée par un check ; en dessous, la frise des deux
// échéances de la facturation électronique (2026 réception, 2027 émission)
// qui s'allument l'une après l'autre.
export default function LawAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const mention = container.querySelector(".law-mention");
      const typed = { n: 0 };

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });

      tl.fromTo(
        ".law-invoice",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      // La mention s'écrit caractère par caractère
      tl.to(
        typed,
        {
          n: MENTION.length,
          duration: 1.6,
          ease: "none",
          onUpdate: () => {
            if (mention)
              mention.textContent = MENTION.slice(0, Math.round(typed.n));
          },
        },
        "+=0.3",
      );
      tl.fromTo(
        ".law-check",
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
        "-=0.1",
      );

      // Frise des échéances
      tl.fromTo(
        ".law-track",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: "power2.inOut" },
        "+=0.2",
      );
      tl.to(
        ".law-dot-0",
        { backgroundColor: "#1D1D1B", duration: 0.25 },
        "<0.35",
      );
      tl.to(".law-lbl-0", { color: "#1D1D1B", duration: 0.25 }, "<");
      tl.to(
        ".law-dot-1",
        { backgroundColor: "#1D1D1B", duration: 0.25 },
        "<0.5",
      );
      tl.to(".law-lbl-1", { color: "#1D1D1B", duration: 0.25 }, "<");

      // Hold + sortie
      tl.to({}, { duration: 2.5 });
      tl.to([".law-invoice", ".law-check"], {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
      tl.to(
        ".law-track",
        { scaleX: 0, duration: 0.5, ease: "power2.inOut" },
        "<",
      );
      tl.to(
        [".law-dot-0", ".law-dot-1"],
        { backgroundColor: "#D1D5DB", duration: 0.3 },
        "<",
      );
      tl.to(
        [".law-lbl-0", ".law-lbl-1"],
        { color: "#9CA3AF", duration: 0.3 },
        "<",
      );
      tl.set(typed, { n: 0 });
      tl.call(() => {
        if (mention) mention.textContent = "";
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
    >
      {/* Mini-facture : en-tête, lignes, pied de page avec la mention */}
      <div className="law-invoice relative w-full max-w-[250px] rounded-2xl bg-white p-5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-neutral-900">
            Facture n° 2026-014
          </span>
          <span className="text-[10px] text-neutral-400">12/09/2026</span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-3/4 rounded bg-neutral-100" />
          <div className="h-1.5 w-1/2 rounded bg-neutral-100" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span className="text-[11px] text-neutral-500">Total</span>
          <span className="text-[13px] font-medium text-neutral-900">
            850,00 €
          </span>
        </div>
        <p className="mt-3 min-h-[28px] text-[10px] leading-snug text-neutral-500">
          <span className="law-mention" />
          <span className="law-caret inline-block w-px h-3 bg-neutral-400 align-middle animate-pulse" />
        </p>
        <div className="law-check absolute -top-3 -right-3 flex size-7 items-center justify-center rounded-full bg-[#22C55E] opacity-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      {/* Frise des échéances */}
      <div className="relative mt-10 w-full max-w-[240px]">
        <div className="absolute left-0 right-0 top-[5px] h-px bg-neutral-200" />
        <div className="law-track absolute left-0 right-0 top-[5px] h-px bg-neutral-800 origin-left scale-x-0" />
        <div className="relative flex justify-between">
          {[
            ["2026", "Réception"],
            ["2027", "Émission"],
          ].map(([year, label], i) => (
            <div key={year} className="flex flex-col items-center">
              <span
                className={`law-dot-${i} size-[11px] rounded-full ring-4 ring-[#F6F6F8]`}
                style={{ backgroundColor: "#D1D5DB" }}
              />
              <span
                className={`law-lbl-${i} mt-2.5 text-[11px] leading-tight text-center`}
                style={{ color: "#9CA3AF" }}
              >
                <span className="block font-medium">{year}</span>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
