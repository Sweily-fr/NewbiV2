"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const notifications = [
  { name: "Julie Martin", file: "Maquette_Final.psd", time: "Il y a 2 min", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Thomas Leroy", file: "Rushes_Campagne.mov", time: "Il y a 5 min", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Camille Dubois", file: "Brand_Assets.zip", time: "Il y a 12 min", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
];

export default function ShareTrackingAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });

      // Phase 1 — Link card appears
      tl.fromTo(
        ".anim-link-card",
        { y: 15, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }
      );

      // Phase 2 — Link URL types in
      tl.fromTo(
        ".anim-url",
        { width: "0%" },
        { width: "100%", duration: 0.6, ease: "power1.out" },
        "+=0.2"
      );

      // Phase 3 — Copy button click
      tl.to(".anim-copy-btn", { scale: 0.92, duration: 0.08 }, "+=0.3");
      tl.to(".anim-copy-btn", { scale: 1, duration: 0.08 });
      tl.to(".anim-copy-text", { opacity: 0, duration: 0.1 });
      tl.fromTo(
        ".anim-copied-text",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(1.5)" }
      );

      // Phase 4 — Link card shrinks up
      tl.to(".anim-link-card", {
        y: -8,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.inOut",
      }, "+=0.5");

      // Phase 5 — Notifications panel slides in
      tl.fromTo(
        ".anim-notif-panel",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
        "-=0.1"
      );

      // Phase 6 — Notifications appear one by one with bell ring
      notifications.forEach((_, i) => {
        // Bell ring
        tl.fromTo(
          ".anim-bell",
          { rotation: 0 },
          { rotation: 15, duration: 0.08, ease: "power2.out" },
          `+=0.4`
        );
        tl.to(".anim-bell", { rotation: -10, duration: 0.08 });
        tl.to(".anim-bell", { rotation: 5, duration: 0.06 });
        tl.to(".anim-bell", { rotation: 0, duration: 0.06 });

        // Notification slides in
        tl.fromTo(
          `.anim-notif-${i}`,
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
          "-=0.15"
        );

        // Counter updates
        tl.to(".anim-counter", {
          textContent: `${i + 1}`,
          duration: 0.1,
          snap: { textContent: 1 },
        }, "-=0.2");
      });

      // Phase 7 — Stats bar appears
      tl.fromTo(
        ".anim-stats",
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
        "+=0.3"
      );

      // Hold
      tl.to({}, { duration: 2.5 });

      // Fade out
      tl.to(
        [".anim-link-card", ".anim-notif-panel", ".anim-stats"],
        { opacity: 0, y: -5, duration: 0.4, ease: "power2.in" }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-5">
      <div className="relative w-full max-w-[340px]">

        {/* ── Link card ── */}
        <div className="anim-link-card opacity-0 mb-3">
          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span className="text-[11px] font-semibold text-neutral-800">Lien de partage actif</span>
              </div>
              <span className="text-[8px] text-neutral-400">Expire dans 7j</span>
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="px-4 py-3 flex items-center gap-2">
              <div className="flex-1 bg-[#F8F9FA] rounded-lg px-3 py-2 overflow-hidden">
                <div className="anim-url overflow-hidden whitespace-nowrap" style={{ width: "0%" }}>
                  <span className="text-[11px] text-neutral-600 font-mono">newbi.fr/t/xK9mQ2pL</span>
                </div>
              </div>
              <button className="anim-copy-btn bg-[#1D1D1B] text-white rounded-lg px-3.5 py-2 text-[10px] font-semibold relative overflow-hidden shrink-0">
                <span className="anim-copy-text">Copier</span>
                <span className="anim-copied-text absolute inset-0 flex items-center justify-center text-[#22C55E] bg-[#1D1D1B] opacity-0">Copié ✓</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Notifications panel ── */}
        <div className="anim-notif-panel opacity-0">
          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="anim-bell">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-neutral-800">Téléchargements</span>
              </div>
              <div className="bg-[#5A50FF] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                <span className="anim-counter">0</span>
              </div>
            </div>
            <div className="h-px bg-neutral-100" />

            {/* Notification rows */}
            <div className="p-2.5 space-y-1.5">
              {notifications.map((notif, i) => (
                <div key={i} className={`anim-notif-${i} flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F8F9FA] opacity-0`}>
                  <img src={notif.avatar} alt={notif.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-neutral-800">
                      <span className="font-semibold">{notif.name}</span>
                      <span className="text-neutral-500"> a téléchargé</span>
                    </p>
                    <p className="text-[9px] text-neutral-400 truncate">{notif.file}</p>
                  </div>
                  <span className="text-[8px] text-neutral-400 shrink-0">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="anim-stats mt-2 flex items-center justify-between px-1 opacity-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-[9px] text-neutral-500">8 vues</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span className="text-[9px] text-neutral-500">3 téléchargements</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[8px] text-neutral-400">SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
