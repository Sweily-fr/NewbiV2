"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const files = [
  { src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&q=80", name: "runway_show.jpg", size: "3.2 MB", rotate: -5 },
  { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&q=80", name: "backstage.png", size: "4.8 MB", rotate: 3 },
  { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80", name: "collection.jpg", size: "2.1 MB", rotate: -2 },
];

const CIRCUMFERENCE = 2 * Math.PI * 22;

export function MobileDragDropAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

      // Phase 1: Upload zone appears
      tl.fromTo(
        ".m-dropzone",
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
      );

      // Phase 2: Cards fall in
      files.forEach((file, i) => {
        tl.fromTo(
          `.m-card-${i}`,
          { y: -50, opacity: 0, rotation: file.rotate * 2 },
          { y: 0, opacity: 1, rotation: file.rotate, duration: 0.45, ease: "back.out(1.3)" },
          i === 0 ? "+=0.3" : "-=0.25"
        );
      });

      // Phase 3: Cards shrink into dropzone
      tl.to(".m-cards-wrap", {
        scale: 0.5,
        y: 40,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in",
      }, "+=0.5");

      // Phase 4: Dropzone morphs to progress
      tl.to(".m-dropzone-content", { opacity: 0, duration: 0.2 });
      tl.fromTo(
        ".m-progress-content",
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );

      // Phase 5: Ring progress animates
      tl.fromTo(
        ".m-progress-ring",
        { strokeDashoffset: CIRCUMFERENCE },
        { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }
      );

      // Phase 6: Check appears
      tl.to(".m-progress-ring", { stroke: "#22C55E", duration: 0.2 });
      tl.fromTo(
        ".m-check",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }
      );

      // Phase 7: File list slides up
      tl.fromTo(
        ".m-filelist",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
        "+=0.3"
      );
      tl.fromTo(
        ".m-filerow",
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.2, ease: "power2.out", stagger: 0.1 },
        "-=0.1"
      );

      // Hold
      tl.to({}, { duration: 2 });

      // Fade out
      tl.to(
        [".m-dropzone", ".m-filelist"],
        { opacity: 0, y: -8, duration: 0.4, ease: "power2.in" }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center gap-4 py-8">
      {/* Drop zone */}
      <div className="m-dropzone relative w-[280px] opacity-0">
        {/* Floating cards */}
        <div className="m-cards-wrap flex justify-center mb-3" style={{ gap: "-4px" }}>
          {files.map((file, i) => (
            <div
              key={i}
              className={`m-card-${i} opacity-0 w-[80px] rounded-xl overflow-hidden border border-neutral-200 shadow-lg bg-white`}
              style={{ zIndex: 10 + i, marginLeft: i > 0 ? "-8px" : 0 }}
            >
              <div className="h-[56px] overflow-hidden">
                <img src={file.src} alt={file.name} className="w-full h-full object-cover" />
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[7px] font-medium text-neutral-700 truncate">{file.name}</p>
                <p className="text-[6px] text-neutral-400">{file.size}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Drop zone box */}
        <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 relative overflow-hidden">
          {/* Default content */}
          <div className="m-dropzone-content flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <p className="text-[10px] text-neutral-500 text-center">Déposez vos fichiers ici</p>
          </div>

          {/* Progress content (hidden initially) */}
          <div className="m-progress-content absolute inset-0 flex flex-col items-center justify-center opacity-0">
            <div className="relative">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#f0f0f0" strokeWidth="4" />
                <circle
                  className="m-progress-ring"
                  cx="26" cy="26" r="22" fill="none"
                  stroke="#5A50FF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE}
                  transform="rotate(-90 26 26)"
                />
              </svg>
              <div className="m-check absolute inset-0 flex items-center justify-center opacity-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">Transfert terminé</p>
          </div>
        </div>
      </div>

      {/* File list */}
      <div className="m-filelist w-[280px] opacity-0">
        <div className="bg-[#F8F9FA] rounded-xl p-2.5 space-y-1.5">
          {files.map((file, i) => (
            <div key={i} className="m-filerow flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white opacity-0">
              <div className="w-7 h-7 rounded-md overflow-hidden shrink-0">
                <img src={file.src} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-neutral-700 truncate">{file.name}</p>
                <p className="text-[8px] text-neutral-400">{file.size}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
