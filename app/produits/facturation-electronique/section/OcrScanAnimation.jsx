"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const extractedFields = [
  { label: "Fournisseur", value: "Studio Graphique SAS" },
  { label: "N° Facture", value: "FA-2026-0187" },
  { label: "Date", value: "15/03/2026" },
  { label: "Montant HT", value: "2 400,00 €" },
  { label: "TVA (20%)", value: "480,00 €" },
  { label: "Total TTC", value: "2 880,00 €", bold: true },
];

export default function OcrScanAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

      // Step 1: Facture image slides in
      tl.fromTo(
        ".anim-facture",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Step 2: Scan line sweeps down over the facture
      tl.fromTo(
        ".anim-scanline",
        { top: "0%", opacity: 0 },
        { top: "0%", opacity: 1, duration: 0.1 },
        "+=0.3"
      );
      tl.to(".anim-scanline", {
        top: "100%",
        duration: 1.2,
        ease: "power1.inOut",
      });
      tl.to(".anim-scanline", { opacity: 0, duration: 0.15 });

      // Step 3: Data overlay card appears
      tl.fromTo(
        ".anim-datacard",
        { y: 15, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" },
        "-=0.2"
      );

      // Step 4: Fields appear one by one
      tl.fromTo(
        ".anim-field",
        { x: 10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.2, ease: "power2.out", stagger: 0.08 },
        "+=0.1"
      );

      // Step 5: Badge check pops
      tl.fromTo(
        ".anim-check",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.7)" },
        "+=0.15"
      );

      // Hold then fade
      tl.to({}, { duration: 2 });
      tl.to(
        [".anim-facture", ".anim-datacard", ".anim-check"],
        { opacity: 0, duration: 0.4, ease: "power2.in" }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* Facture image */}
      <div className="anim-facture absolute left-[48%] -translate-x-1/2 top-2 w-[62%] opacity-0">
        <div className="relative">
          <img
            src="/lp/factures/facture-preview.png"
            alt="Facture d'achat"
            className="w-full h-auto shadow-md"
          />
          {/* Scan line */}
          <div
            className="anim-scanline absolute left-0 right-0 h-px z-10 opacity-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #B8B3FF 30%, #B8B3FF 70%, transparent 100%)",
              boxShadow: "0 0 6px rgba(184,179,255,0.3)",
            }}
          />
        </div>
      </div>

      {/* Extracted data card - overlaid bottom right */}
      <div className="anim-datacard absolute bottom-4 right-3 w-[55%] opacity-0 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-neutral-100 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-[9px] font-semibold text-neutral-700">Données extraites</span>
          </div>

          {/* Fields */}
          <div className="px-3.5 py-2.5 space-y-1.5">
            {extractedFields.map((field, i) => (
              <div
                key={i}
                className={`anim-field flex items-center justify-between opacity-0 ${field.bold ? "pt-1.5 border-t border-neutral-100" : ""}`}
              >
                <span className="text-[8px] text-neutral-400">{field.label}</span>
                <span className={`text-[9px] ${field.bold ? "font-bold text-neutral-900" : "font-medium text-neutral-700"}`}>
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Check badge */}
        <div className="anim-check absolute -top-2 -right-2 opacity-0">
          <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center shadow-md">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
