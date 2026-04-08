"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const dataItems = [
  { label: "Transactions", icon: "receipt", safe: true },
  { label: "Soldes", icon: "wallet", safe: true },
  { label: "Mot de passe", icon: "key", safe: false },
  { label: "Historique", icon: "clock", safe: true },
  { label: "Identifiants", icon: "user", safe: false },
  { label: "Exports", icon: "download", safe: true },
];

function DataIcon({ type, className = "" }) {
  const icons = {
    receipt: <path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2z" />,
    wallet: <><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="M10.5 12.5L17 6M15 8l2-2" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  };

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icons[type]}
    </svg>
  );
}

export default function DataFilterAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

      // Step 0: Labels fade in
      tl.fromTo(
        ".anim-label",
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.1 }
      );

      // Shield pulse in
      tl.fromTo(
        ".anim-shield",
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" },
        "-=0.2"
      );

      // Pulse ring on logo
      tl.fromTo(
        ".anim-pulse",
        { scale: 0.8, opacity: 0.6 },
        { scale: 1.6, opacity: 0, duration: 0.8, ease: "power2.out" },
        "-=0.3"
      );

      // Process each data item
      dataItems.forEach((item, i) => {
        const selector = `.anim-capsule-${i}`;
        const resultSelector = `.anim-result-${i}`;

        // Capsule slides in from left
        tl.fromTo(
          selector,
          { x: -60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
          `+=0.15`
        );

        // Capsule moves toward shield
        tl.to(selector, {
          x: 40,
          duration: 0.25,
          ease: "power1.in",
        });

        if (item.safe) {
          // Safe: passes through, result appears on right
          tl.to(selector, { opacity: 0, duration: 0.1 });
          tl.fromTo(
            resultSelector,
            { x: -10, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
            "-=0.05"
          );
          // Update counter
          tl.to(".anim-count-safe", {
            textContent: `${dataItems.slice(0, i + 1).filter(d => d.safe).length}`,
            duration: 0.1
          }, "-=0.2");
        } else {
          // Blocked: bounces back and fades
          tl.to(selector, {
            x: -30,
            opacity: 0,
            duration: 0.3,
            ease: "back.in(2)",
          });
          tl.fromTo(
            resultSelector,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.7)" },
            "-=0.15"
          );
          // Update counter
          tl.to(".anim-count-blocked", {
            textContent: `${dataItems.slice(0, i + 1).filter(d => !d.safe).length}`,
            duration: 0.1
          }, "-=0.2");
        }
      });

      // Counter summary pop in
      tl.fromTo(
        ".anim-counter",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
        "+=0.3"
      );

      // Hold then fade all
      tl.to({}, { duration: 2 });
      tl.to(
        [".anim-shield", ".anim-label", ".anim-counter", "[class*='anim-capsule-']", "[class*='anim-result-']"],
        { opacity: 0, duration: 0.4, ease: "power2.in" }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-6">
      <div className="relative w-full max-w-[340px]">
        {/* Labels top */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="anim-label text-[9px] uppercase tracking-wider text-neutral-400 font-semibold opacity-0">
            Données entrantes
          </span>
          <span className="anim-label text-[9px] uppercase tracking-wider text-neutral-400 font-semibold opacity-0">
            Résultat
          </span>
        </div>

        {/* Shield line — same height as the list */}
        <div className="anim-shield absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-0" style={{ top: "24px", bottom: "40px" }}>
          {/* Dashed line top */}
          <div className="border-l border-dashed border-neutral-300" style={{ height: "calc(50% - 24px)" }} />
          {/* Logo with pulse */}
          <div className="shrink-0 py-1.5 relative">
            <div className="anim-pulse absolute inset-0 rounded-xl bg-[#5A50FF]/10" />
            <img src="/newbi-icon.svg" alt="Newbi" className="w-12 h-12 relative z-10" />
          </div>
          {/* Dashed line bottom */}
          <div className="border-l border-dashed border-neutral-300" style={{ height: "calc(50% - 24px)" }} />
        </div>

        {/* Data flow rows */}
        <div className="w-full space-y-2">
          {dataItems.map((item, i) => (
            <div key={i} className="flex items-center h-8">
              {/* Left: incoming capsule */}
              <div className="w-[42%] flex justify-end pr-4">
                <div
                  className={`anim-capsule-${i} inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium opacity-0 ${
                    item.safe
                      ? "bg-[#EEF2FF] text-[#6366F1]"
                      : "bg-[#FEF2F2] text-[#EF4444]"
                  }`}
                >
                  <DataIcon type={item.icon} className={item.safe ? "text-[#6366F1]" : "text-[#EF4444]"} />
                  {item.label}
                </div>
              </div>

              {/* Center: gap for shield */}
              <div className="w-[16%]" />

              {/* Right: result */}
              <div className="w-[42%] pl-4">
                <div
                  className={`anim-result-${i} inline-flex items-center gap-1 text-[10px] font-medium opacity-0`}
                >
                  {item.safe ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-[#22C55E]">Chiffré</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      <span className="text-[#EF4444]">Bloqué</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Counter summary */}
        <div className="anim-counter flex items-center justify-center gap-4 mt-4 opacity-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[10px] text-neutral-500"><span className="anim-count-safe font-semibold text-neutral-700">0</span> chiffrées</span>
          </div>
          <div className="w-px h-3 bg-neutral-200" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-[10px] text-neutral-500"><span className="anim-count-blocked font-semibold text-neutral-700">0</span> bloquées</span>
          </div>
        </div>
      </div>
    </div>
  );
}
