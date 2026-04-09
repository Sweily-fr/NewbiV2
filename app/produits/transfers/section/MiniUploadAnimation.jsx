"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const files = [
  {
    name: "Maquette_Final.psd",
    size: "1.8 Go",
    color: "#5A50FF",
    preview: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&q=80",
  },
  {
    name: "Rushes_Campagne.mov",
    size: "3.2 Go",
    color: "#E8723A",
    preview: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&q=80",
  },
  {
    name: "Brand_Assets.zip",
    size: "980 Mo",
    color: "#1D6B4F",
    preview: null,
    ext: "ZIP",
  },
];

export default function MiniUploadAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });

      // Phase 1 — Cards cascade in
      tl.fromTo(
        ".anim-card-0",
        { y: -40, opacity: 0, rotation: -4 },
        { y: 0, opacity: 1, rotation: -3, duration: 0.5, ease: "back.out(1.3)" }
      );
      tl.fromTo(
        ".anim-card-1",
        { y: -40, opacity: 0, rotation: 3 },
        { y: 0, opacity: 1, rotation: 2, duration: 0.5, ease: "back.out(1.3)" },
        "-=0.3"
      );
      tl.fromTo(
        ".anim-card-2",
        { y: -40, opacity: 0, rotation: -1 },
        { y: 0, opacity: 1, rotation: 0, duration: 0.5, ease: "back.out(1.3)" },
        "-=0.3"
      );

      // Phase 2 — Cursor appears and clicks
      tl.fromTo(
        ".anim-cursor",
        { opacity: 0, x: 20, y: 20 },
        { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" },
        "+=0.4"
      );
      tl.to(".anim-cursor", { scale: 0.85, duration: 0.1 });
      tl.to(".anim-cursor", { scale: 1, duration: 0.1 });

      // Phase 3 — Cards shrink and fly into the transfer panel
      tl.to(".anim-cards-wrap", {
        scale: 0.6,
        y: 30,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in",
      });
      tl.to(".anim-cursor", { opacity: 0, duration: 0.2 }, "-=0.3");

      // Phase 4 — Transfer panel slides up
      tl.fromTo(
        ".anim-panel",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
      );

      // Phase 5 — Rows appear with stagger
      tl.fromTo(
        ".anim-row",
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: "power2.out", stagger: 0.12 },
        "-=0.15"
      );

      // Phase 6 — Progress bars animate
      files.forEach((_, i) => {
        tl.fromTo(
          `.anim-progress-${i}`,
          { width: "0%" },
          { width: "100%", duration: 0.7 + i * 0.2, ease: "power1.out" },
          i === 0 ? "+=0.2" : "<0.15"
        );
      });

      // Phase 7 — Percentage updates and checks appear
      tl.fromTo(
        ".anim-check",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)", stagger: 0.12 },
        "-=0.3"
      );

      // Phase 8 — Bottom bar slides in
      tl.fromTo(
        ".anim-bottom",
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
        "-=0.1"
      );

      // Hold
      tl.to({}, { duration: 2.5 });

      // Fade all
      tl.to(
        [".anim-panel", ".anim-bottom"],
        { opacity: 0, y: -8, duration: 0.4, ease: "power2.in" }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-5">
      <div className="relative w-full max-w-[380px]">

        {/* ── Phase 1: File preview cards ── */}
        <div className="anim-cards-wrap">
          <div className="flex justify-center items-end gap-[-8px] mb-4" style={{ gap: "-8px" }}>
            {files.map((file, i) => (
              <div
                key={i}
                className={`anim-card-${i} opacity-0 relative`}
                style={{ zIndex: 10 + i }}
              >
                <div
                  className="w-[115px] rounded-2xl overflow-hidden border border-neutral-200/80 bg-white shadow-lg"
                >
                  {/* Preview image or icon */}
                  {file.preview ? (
                    <div className="h-[78px] overflow-hidden">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-[78px] flex items-center justify-center" style={{ backgroundColor: `${file.color}08` }}>
                      <div className="w-10 h-12 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${file.color}40` }}>
                        <span className="text-[9px] font-bold" style={{ color: file.color }}>{file.ext}</span>
                      </div>
                    </div>
                  )}
                  {/* File info */}
                  <div className="px-2.5 py-2">
                    <p className="text-[9px] font-semibold text-neutral-800 truncate">{file.name}</p>
                    <p className="text-[8px] text-neutral-400 mt-0.5">{file.size}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cursor ── */}
        <div className="anim-cursor absolute bottom-[35%] right-[20%] opacity-0 z-30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="#1D1D1B" strokeWidth="1" strokeLinejoin="round">
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.85a.5.5 0 00-.85.36z" />
          </svg>
        </div>

        {/* ── Phase 4: Transfer panel ── */}
        <div className="anim-panel absolute inset-0 opacity-0">
          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/newbi-icon.svg" alt="Newbi" className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold text-neutral-900">Transfert en cours</p>
                  <p className="text-[9px] text-neutral-400">3 fichiers · 5.98 Go</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5A50FF] animate-pulse" />
              </div>
            </div>

            <div className="h-px bg-neutral-100" />

            {/* File rows */}
            <div className="p-3 space-y-1.5">
              {files.map((file, i) => (
                <div key={i} className="anim-row flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F8F9FA] opacity-0">
                  {/* Thumbnail */}
                  {file.preview ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src={file.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${file.color}10` }}>
                      <span className="text-[8px] font-bold" style={{ color: file.color }}>{file.ext}</span>
                    </div>
                  )}
                  {/* Info + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-medium text-neutral-800 truncate">{file.name}</p>
                      <span className="text-[9px] text-neutral-400 ml-2 shrink-0">{file.size}</span>
                    </div>
                    <div className="h-[3px] w-full bg-neutral-200/60 rounded-full overflow-hidden">
                      <div
                        className={`anim-progress-${i} h-full rounded-full`}
                        style={{ backgroundColor: file.color, width: "0%" }}
                      />
                    </div>
                  </div>
                  {/* Check */}
                  <div className="anim-check opacity-0 shrink-0 w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="anim-bottom mt-2 flex items-center justify-between px-1 opacity-0">
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[9px] text-neutral-500">Chiffrement SSL de bout en bout</span>
            </div>
            <span className="text-[9px] font-semibold text-[#5A50FF]">5 Go max</span>
          </div>
        </div>
      </div>
    </div>
  );
}
