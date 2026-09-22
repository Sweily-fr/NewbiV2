"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const COLS = 5;
const ROWS = 3;
const CENTER = Math.floor((COLS * ROWS) / 2); // case du milieu

// Carte « Par où commencer ? » (version auto-entrepreneur, copie de
// /lp/facturation-electronique) — une grille d'apps discrète ; l'icône Newbi
// ressort au centre, un curseur clique dessus, et le statut micro-entrepreneur
// est détecté depuis le SIRET : il n'y a rien d'autre à faire.
export default function StartAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });

      // Les cases apparaissent, puis Newbi ressort
      tl.fromTo(
        ".start-cell",
        { scale: 0.85, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          stagger: { each: 0.03, from: "center" },
        },
      );
      tl.to(
        ".start-app",
        { scale: 1.55, duration: 0.55, ease: "back.out(1.6)" },
        "+=0.2",
      );
      tl.to(
        ".start-app",
        { boxShadow: "0 22px 40px -18px rgba(0,0,0,0.45)", duration: 0.4 },
        "<",
      );

      // Curseur + clic
      tl.fromTo(
        ".start-cursor",
        { x: 70, y: 60, opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
        "+=0.3",
      );
      tl.to(".start-app", { scale: 1.45, duration: 0.1 });
      tl.to(".start-app", { scale: 1.55, duration: 0.25, ease: "back.out(2)" });
      tl.fromTo(
        ".start-ripple",
        { scale: 1, opacity: 0.5 },
        { scale: 2.2, opacity: 0, duration: 0.7, ease: "power2.out" },
        "<",
      );
      tl.fromTo(
        ".start-label",
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
        "-=0.4",
      );

      // Hold + sortie
      tl.to({}, { duration: 2.2 });
      tl.to([".start-cursor", ".start-label"], {
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
      });
      tl.to(
        ".start-app",
        {
          scale: 1,
          boxShadow: "0 0 0 0 rgba(0,0,0,0)",
          duration: 0.4,
          ease: "power2.inOut",
        },
        "<",
      );
      tl.to(
        ".start-cell",
        { opacity: 0, duration: 0.35, stagger: { each: 0.02, from: "edges" } },
        "<0.1",
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Grille d'apps, fondue vers les bords ; Newbi est la case centrale */}
      <div className="relative [mask-image:radial-gradient(circle_at_center,black_35%,transparent_80%)]">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: COLS * ROWS }).map((_, i) =>
            i === CENTER ? (
              <div key={i} className="start-cell relative z-10 size-14">
                <span className="start-ripple absolute inset-0 rounded-2xl border border-neutral-400 opacity-0" />
                <img
                  src="/newbi-icon.png"
                  alt="Application Newbi"
                  className="start-app relative size-14 rounded-2xl"
                />
                <div className="start-cursor absolute -bottom-5 -right-5 opacity-0 z-20">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="white"
                    stroke="#1D1D1B"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  >
                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.85a.5.5 0 00-.85.36z" />
                  </svg>
                </div>
              </div>
            ) : (
              <span
                key={i}
                className="start-cell size-14 rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              />
            ),
          )}
        </div>
      </div>

      <span className="start-label opacity-0 mt-6 text-[12px] font-medium text-neutral-900">
        Statut micro-entrepreneur détecté
      </span>
    </div>
  );
}
