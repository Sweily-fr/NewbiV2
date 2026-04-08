"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const categories = [
  { color: "#A585DB", label: "Fournitures", amount: "4 820 €", pct: "35", dash: "198", offset: "0" },
  { color: "#7BC8A4", label: "Abonnements SaaS", amount: "3 180 €", pct: "23", dash: "130", offset: "-198" },
  { color: "#E8B87D", label: "Déplacements", amount: "2 760 €", pct: "20", dash: "113", offset: "-328" },
  { color: "#85B8E0", label: "Repas", amount: "1 640 €", pct: "12", dash: "68", offset: "-441" },
  { color: "#F4A89A", label: "Autres", amount: "1 380 €", pct: "10", dash: "57", offset: "-509" },
];

export default function ExpenseDonutAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });

      // Step 1: Whole donut + center scale in together
      tl.fromTo(
        ".anim-donut",
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Step 2: Legend items slide in
      tl.fromTo(
        ".anim-legend",
        { x: 15, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: "power2.out", stagger: 0.08 },
        "-=0.2"
      );

      // Step 4: Highlight each segment one by one
      categories.forEach((_, i) => {
        tl.to(`.anim-segment-${i}`, {
          strokeWidth: 28,
          duration: 0.2,
          ease: "power2.out",
        }, `+=0.4`);
        tl.to(`.anim-legend-${i}`, {
          scale: 1.03,
          fontWeight: 700,
          duration: 0.2,
          ease: "power2.out",
        }, "<");
        tl.to(`.anim-segment-${i}`, {
          strokeWidth: 22,
          duration: 0.2,
          ease: "power2.in",
        }, "+=0.3");
        tl.to(`.anim-legend-${i}`, {
          scale: 1,
          fontWeight: 400,
          duration: 0.2,
          ease: "power2.in",
        }, "<");
      });

      // Hold then fade
      tl.to({}, { duration: 1.5 });
      tl.to(
        [".anim-donut", ".anim-legend"],
        { opacity: 0, duration: 0.4, ease: "power2.in" }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="flex items-center justify-center h-full px-6 gap-6">
        {/* Donut */}
        <div className="anim-donut relative shrink-0 opacity-0">
          <svg width="180" height="180" viewBox="-5 -5 210 210">
            {/* Background ring */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="#f5f5f5" strokeWidth="22" />

            {/* Segments */}
            {categories.map((cat, i) => (
              <circle
                key={i}
                className={`anim-segment anim-segment-${i}`}
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke={cat.color}
                strokeWidth="22"
                strokeDasharray={`${cat.dash} ${566 - parseInt(cat.dash)}`}
                strokeDashoffset={cat.offset}
                strokeLinecap="butt"
                transform="rotate(-90 100 100)"
                style={{ transition: "stroke-width 0.2s" }}
              />
            ))}

            {/* White center */}
            <circle cx="100" cy="100" r="74" fill="white" />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-neutral-900">13 780 €</span>
            <span className="text-[9px] text-neutral-400">Total achats</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5">
          {categories.map((cat, i) => (
            <div key={i} className={`anim-legend anim-legend-${i} flex items-center gap-2.5 opacity-0`}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <div>
                <p className="text-[11px] font-normal text-neutral-800">{cat.label}</p>
                <p className="text-[9px] text-neutral-400">{cat.amount} · {cat.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
