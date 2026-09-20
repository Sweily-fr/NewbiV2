"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

// Carte « Ce que la loi te demande » — volontairement minimal : le badge
// officiel « compatible facturation électronique » flotte doucement, et une
// fine frise en dessous marque les deux échéances (2026 réception, 2027
// émission) qui s'allument l'une après l'autre.
export default function LawAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Flottement continu du badge
      gsap.fromTo(
        ".law-badge",
        { y: 0 },
        { y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 },
      );

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
      tl.fromTo(
        ".law-track",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: "power2.inOut" },
      );
      tl.to(".law-dot-0", { backgroundColor: "#1D1D1B", duration: 0.25 }, 0.35);
      tl.to(".law-lbl-0", { color: "#1D1D1B", duration: 0.25 }, "<");
      tl.to(".law-dot-1", { backgroundColor: "#1D1D1B", duration: 0.25 }, 0.85);
      tl.to(".law-lbl-1", { color: "#1D1D1B", duration: 0.25 }, "<");
      tl.to({}, { duration: 2.5 });
      tl.to(".law-track", { scaleX: 0, duration: 0.5, ease: "power2.inOut" });
      tl.to(
        [".law-dot-0", ".law-dot-1"],
        { backgroundColor: "#D1D5DB", duration: 0.3 },
        "<",
      );
      tl.to(
        [".law-lbl-0", ".law-lbl-1"],
        { color: "#9CA3AF", duration: 0.3 },
        "<",
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
    >
      {/* Badge officiel */}
      <div className="law-badge rounded-2xl bg-white px-7 py-5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)]">
        <img
          src="/logo_Compatible_Facturation_electronique-footer.png"
          alt="Solution compatible facturation électronique"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Frise des échéances */}
      <div className="relative mt-10 w-full max-w-[240px]">
        <div className="absolute left-0 right-0 top-[5px] h-px bg-neutral-200" />
        <div className="law-track absolute left-0 right-0 top-[5px] h-px bg-neutral-800 origin-left scale-x-0" />
        <div className="relative flex justify-between">
          {[
            ["2026", "Réception"],
            ["2027", "Émission"],
          ].map(([year, label], i) => (
            <div key={year} className="flex flex-col items-center">
              <span
                className={`law-dot-${i} size-[11px] rounded-full ring-4 ring-[#F6F6F8]`}
                style={{ backgroundColor: "#D1D5DB" }}
              />
              <span
                className={`law-lbl-${i} mt-2.5 text-[11px] leading-tight text-center`}
                style={{ color: "#9CA3AF" }}
              >
                <span className="block font-medium">{year}</span>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
