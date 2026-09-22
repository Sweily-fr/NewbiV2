"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

// Carte « Ce que Newbi fait à ta place » (version auto-entrepreneur, copie
// de /lp/facturation-electronique) — une facture à gauche, une ligne qui
// passe par deux étapes (mentions, numérotation) et arrive sur un check
// vert : la facture part conforme, sans rien faire.
export default function AutomationAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

      tl.fromTo(
        ".auto-doc",
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
      );
      // La ligne se dessine, le point voyage, les étapes s'allument
      tl.fromTo(
        ".auto-track",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, ease: "power1.inOut" },
        "+=0.2",
      );
      tl.fromTo(
        ".auto-packet",
        { left: "0%", opacity: 0 },
        { left: "100%", opacity: 1, duration: 1.6, ease: "power1.inOut" },
        "<",
      );
      tl.to(
        ".auto-step-0",
        { backgroundColor: "#1D1D1B", duration: 0.2 },
        "<0.5",
      );
      tl.to(
        ".auto-step-1",
        { backgroundColor: "#1D1D1B", duration: 0.2 },
        "<0.55",
      );
      tl.to(".auto-packet", { opacity: 0, duration: 0.15 });
      tl.fromTo(
        ".auto-check",
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
        "-=0.1",
      );
      tl.fromTo(
        ".auto-caption",
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
        "-=0.1",
      );

      tl.to({}, { duration: 2.2 });
      tl.to([".auto-doc", ".auto-track", ".auto-check", ".auto-caption"], {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
      tl.set(".auto-track", { scaleX: 0, opacity: 1 });
      tl.set([".auto-step-0", ".auto-step-1"], { backgroundColor: "#D1D5DB" });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
    >
      <div className="flex items-center w-full max-w-[280px]">
        {/* Facture */}
        <div className="auto-doc opacity-0 shrink-0 text-neutral-900">
          {/* Icône facture (lucide file-text, trait fin) */}
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
          </svg>
        </div>

        {/* Trajet */}
        <div className="relative flex-1 mx-3 h-px">
          <div className="absolute inset-0 bg-neutral-200" />
          <div className="auto-track absolute inset-0 bg-neutral-800 origin-left scale-x-0" />
          <span
            className="auto-step-0 absolute top-1/2 left-[33%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-[#F6F6F8]"
            style={{ backgroundColor: "#D1D5DB" }}
          />
          <span
            className="auto-step-1 absolute top-1/2 left-[66%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-[#F6F6F8]"
            style={{ backgroundColor: "#D1D5DB" }}
          />
          <span className="auto-packet absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900 opacity-0" />
        </div>

        {/* Reçue */}
        <div className="auto-check opacity-0 shrink-0 size-8 rounded-full bg-[#22C55E] flex items-center justify-center">
          <svg
            width="14"
            height="14"
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

      {/* Légende des étapes */}
      <div className="auto-caption opacity-0 mt-6 flex items-center gap-2 text-[11px] text-neutral-500">
        <span>Mentions</span>
        <span className="text-neutral-300">→</span>
        <span>Numéro</span>
        <span className="text-neutral-300">→</span>
        <span>Format</span>
        <span className="text-neutral-300">→</span>
        <span className="font-medium text-neutral-900">Transmise</span>
      </div>
    </div>
  );
}
