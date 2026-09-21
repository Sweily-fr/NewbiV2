"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

// Carte « Le devis part du téléphone, la facture arrive toute seule » :
// un document épuré (façon Linear / Notion) ancré en bas à gauche de la
// carte, qui déborde du cadre. Le devis est signé, puis devient facture ;
// une seule touche de couleur (statut vert).
export default function QuoteToInvoiceAnimation() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
      tl.fromTo(
        ".q-doc",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      tl.fromTo(
        ".q-sign",
        { strokeDashoffset: 160 },
        { strokeDashoffset: 0, duration: 1, ease: "power1.inOut" },
        "+=0.4",
      );
      tl.fromTo(
        ".q-signed",
        { opacity: 0, y: 4 },
        { opacity: 1, y: 0, duration: 0.3 },
        "-=0.1",
      );
      // Devis → Facture
      tl.to(".q-kind-quote", { opacity: 0, y: -8, duration: 0.25 }, "+=0.6");
      tl.fromTo(
        ".q-kind-invoice",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3 },
        "-=0.1",
      );
      tl.to(".q-num-quote", { opacity: 0, duration: 0.2 }, "<");
      tl.fromTo(
        ".q-num-invoice",
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        "<0.1",
      );
      tl.to(".q-status-draft", { opacity: 0, duration: 0.2 }, "<");
      tl.fromTo(
        ".q-status-sent",
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.8)" },
        "<0.05",
      );
      tl.to({}, { duration: 2.4 });
      tl.to(".q-doc", { opacity: 0, y: 12, duration: 0.4, ease: "power2.in" });
      tl.set(".q-sign", { strokeDashoffset: 160 });
      tl.set(".q-signed", { opacity: 0 });
      tl.set([".q-kind-quote", ".q-num-quote", ".q-status-draft"], {
        opacity: 1,
        y: 0,
      });
      tl.set([".q-kind-invoice", ".q-num-invoice", ".q-status-sent"], {
        opacity: 0,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {/* Document ancré en bas à gauche, dépassant du bord bas de la carte */}
      <div className="q-doc absolute left-4 md:left-8 bottom-0 w-[400px] max-w-[88%] rounded-t-2xl bg-white border border-b-0 border-neutral-200/80 shadow-[0_-2px_12px_-6px_rgba(0,0,0,0.08)] opacity-0">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="relative h-7">
            <span className="q-kind-quote absolute left-0 top-0 text-[22px] font-semibold tracking-tight text-neutral-900">
              Devis
            </span>
            <span className="q-kind-invoice absolute left-0 top-0 opacity-0 text-[22px] font-semibold tracking-tight text-neutral-900">
              Facture
            </span>
          </div>
          <div className="relative h-6 w-24">
            <span className="q-status-draft absolute right-0 top-0 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
              Brouillon
            </span>
            <span className="q-status-sent absolute right-0 top-0 opacity-0 rounded-md bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
              Envoyée
            </span>
          </div>
        </div>

        {/* Méta */}
        <div className="px-6 py-4 space-y-2.5 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Numéro</span>
            <span className="relative h-4 w-28 text-right text-neutral-900">
              <span className="q-num-quote absolute right-0 top-0">
                D-2026-018
              </span>
              <span className="q-num-invoice absolute right-0 top-0 opacity-0">
                F-2026-041
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Client</span>
            <span className="text-neutral-900">Atelier Horizon</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Total TTC</span>
            <span className="font-medium text-neutral-900">3 240,00 €</span>
          </div>
        </div>

        {/* Signature */}
        <div className="mx-6 mt-1 mb-6 rounded-xl border border-dashed border-neutral-300 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500">Signature client</p>
            <p className="q-signed opacity-0 mt-0.5 text-[11px] font-medium text-neutral-900">
              Signé en ligne · 14:15
            </p>
          </div>
          <svg
            width="96"
            height="32"
            viewBox="0 0 96 32"
            fill="none"
            stroke="#1D1D1B"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path
              className="q-sign"
              strokeDasharray="160"
              strokeDashoffset="160"
              d="M4 22c10-18 16-16 18-4s6 12 12 2 10-14 14-4 6 10 12 0 10-10 16 4 8 6 16 2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
