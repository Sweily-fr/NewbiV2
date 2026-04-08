"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function InvoiceSpeedAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

      // Step 1: Document slides in
      tl.fromTo(
        ".anim-doc",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Step 2: Lines fill in one by one
      tl.fromTo(
        ".anim-line",
        { scaleX: 0, transformOrigin: "left" },
        { scaleX: 1, duration: 0.3, ease: "power2.out", stagger: 0.12 },
        "+=0.2"
      );

      // Step 3: Amount appears
      tl.fromTo(
        ".anim-amount",
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
        "+=0.1"
      );

      // Step 4: Badge "30s" pops
      tl.fromTo(
        ".anim-badge",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
        "+=0.1"
      );

      // Step 5: Checkmark appears
      tl.fromTo(
        ".anim-check",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
        "+=0.2"
      );

      // Step 6: Hold, then fade out
      tl.to(
        [".anim-doc", ".anim-badge", ".anim-check"],
        { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" },
        "+=1.5"
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
      {/* Document */}
      <div className="anim-doc relative w-[260px] bg-white rounded-xl shadow-lg border border-neutral-100 p-6 opacity-0">
        {/* Header with logo */}
        <div className="flex items-center justify-between mb-5">
          <img src="/newbi-icon.svg" alt="Newbi" className="w-6 h-6" />
          <div className="text-[8px] text-neutral-300 font-mono">F-2026-0042</div>
        </div>

        {/* Separator */}
        <div className="h-px bg-neutral-100 mb-4" />

        {/* Lines */}
        <div className="space-y-2.5 mb-5">
          <div className="anim-line h-2 w-full bg-neutral-200/70 rounded-full" />
          <div className="anim-line h-2 w-4/5 bg-neutral-200/70 rounded-full" />
          <div className="anim-line h-2 w-3/5 bg-neutral-200/70 rounded-full" />
          <div className="anim-line h-2 w-full bg-neutral-200/70 rounded-full" />
        </div>

        {/* Separator */}
        <div className="h-px bg-neutral-100 mb-3" />

        {/* Amount */}
        <div className="anim-amount flex items-center justify-between opacity-0">
          <span className="text-[9px] text-neutral-400">Total TTC</span>
          <span className="text-sm font-bold text-neutral-900">1 250,00 €</span>
        </div>

        {/* Check mark */}
        <div className="anim-check absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center shadow-md opacity-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      {/* Badge 30s */}
      <div className="anim-badge absolute bottom-6 right-6 bg-[#5A50FF] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 opacity-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        30 sec
      </div>
    </div>
  );
}
