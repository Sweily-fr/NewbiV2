"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const files = [
  { id: 1, src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=80", name: "runway_show_01.jpg", size: "3.2 MB", rotate: -6 },
  { id: 2, src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&q=80", name: "backstage_paris.png", size: "4.8 MB", rotate: 4 },
  { id: 3, src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80", name: "collection_fw26.jpg", size: "2.1 MB", rotate: -2 },
];

const CIRCUMFERENCE = 2 * Math.PI * 38;

export function DragDropAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parentWrapper = container.parentElement;
    const uploadZoneInner = parentWrapper?.querySelector(".upload-zone-inner");

    const cursor = container.querySelector(".anim-cursor");
    const cursorBubble = container.querySelector(".anim-cursor-bubble");
    const cards = container.querySelectorAll(".anim-card");
    const card1 = cards[0];
    const card2 = cards[1];
    const card3 = cards[2];
    const fileList = container.querySelector(".anim-file-list");
    const fileRows = container.querySelectorAll(".anim-file-row");
    const transferBtn = container.querySelector(".anim-transfer-btn");
    const downloadSection = container.querySelector(".anim-download-section");
    const downloadBtn = container.querySelector(".anim-download-btn");
    const progressEl = container.querySelector(".anim-progress");
    const progressText = container.querySelector("text.anim-progress-text");
    const progressRing = container.querySelector(".anim-progress-ring");
    const revealImgs = container.querySelectorAll(".anim-reveal-img");

    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(cards, { opacity: 0, scale: 0.7, y: -40 });
      gsap.set(cursor, { opacity: 0 });
      gsap.set(cursorBubble, { opacity: 0, scale: 0.5 });
      gsap.set(fileList, { opacity: 0 });
      gsap.set(fileRows, { opacity: 0, x: -15 });
      gsap.set(transferBtn, { opacity: 0, y: 8 });
      gsap.set(downloadSection, { opacity: 0 });
      gsap.set(downloadBtn, { opacity: 0, y: 8 });
      gsap.set(progressEl, { opacity: 0, scale: 0.5 });
      gsap.set(progressRing, { strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE });
      gsap.set(revealImgs, { opacity: 0, scale: 0 });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5, delay: 0.5 });

      // Force reset reveal images at the start of each loop
      tl.call(() => {
        revealImgs.forEach((img) => {
          gsap.set(img, { opacity: 0, scale: 0, left: "30%", top: "30%", rotation: 0 });
        });
        gsap.set(parentWrapper, { scale: 1, transformOrigin: "50% 50%" });
      });

      // ── 1. Cards appear one by one with bounce ──
      tl.to(card1, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" });
      tl.to(card2, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" }, "-=0.2");
      tl.to(card3, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" }, "-=0.2");

      // ── 2. Pause ──
      tl.to({}, { duration: 0.35 });

      // ── 3. Cursor appears and moves to cards ──
      tl.set(cursor, { left: "2%", top: "62%" });
      tl.to(cursor, { opacity: 1, duration: 0.25, ease: "power2.out" });
      tl.to(cursor, { left: "-2%", top: "52%", duration: 0.4, ease: "power2.inOut" });

      // Grab
      tl.to(cursor, { scale: 0.82, duration: 0.08, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.12, ease: "power2.out" });

      // ── 4. Drag to upload zone ──
      const dragDuration = 0.9;

      tl.to(cursor, { left: "24%", top: "22%", duration: dragDuration, ease: "power2.inOut" });
      tl.to(card1, { left: "18%", top: "12%", rotation: -1, duration: dragDuration, ease: "power2.inOut" }, `-=${dragDuration - 0.06}`);
      tl.to(card2, { left: "20%", top: "10%", rotation: 1, duration: dragDuration, ease: "power2.inOut" }, `-=${dragDuration - 0.03}`);
      tl.to(card3, { left: "19%", top: "11%", rotation: 0, duration: dragDuration, ease: "power2.inOut" }, `-=${dragDuration}`);

      // ── 5. Drop — bounce + shrink + fade ──
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      tl.to(cards, { y: "+=10", duration: 0.18, ease: "power2.in" });

      // Device scale bounce on drop
      tl.to(parentWrapper, { scale: 1.015, duration: 0.12, ease: "power2.out" }, "<");
      tl.to(parentWrapper, { scale: 0.997, duration: 0.15, ease: "power2.inOut" });
      tl.to(parentWrapper, { scale: 1, duration: 0.2, ease: "power2.out" });

      tl.to(cards, { y: "-=10", scale: 0, opacity: 0, duration: 0.7, ease: "power3.inOut" }, "-=0.3");

      // ── 6. Zoom in + file list appears ──
      tl.to(parentWrapper, {
        scale: 1.35, transformOrigin: "25% 30%",
        duration: 0.7, ease: "power2.inOut",
      }, "-=0.4");

      tl.to(fileList, { opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.5");

      if (uploadZoneInner) {
        tl.to(uploadZoneInner, { opacity: 0, duration: 0.25, ease: "power2.out" }, "-=0.15");
      }

      tl.to(fileRows, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out", stagger: 0.1 });
      tl.to(transferBtn, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }, "-=0.1");

      // ── 7. Cursor clicks Transfer button ──
      tl.to(cursor, { left: "26%", top: "44%", duration: 0.6, ease: "power2.inOut" });
      tl.to(transferBtn, { scale: 1.03, duration: 0.15, ease: "power2.out" });

      tl.to(cursor, { scale: 0.8, duration: 0.07, ease: "power3.in" });
      tl.to(transferBtn, { scale: 0.97, duration: 0.07, ease: "power3.in" }, "<");
      tl.to(cursor, { scale: 1, duration: 0.15, ease: "elastic.out(1, 0.5)" });
      tl.to(transferBtn, { scale: 1, duration: 0.15, ease: "elastic.out(1, 0.5)" }, "<");

      // ── 8. File list fades → progress bar ──
      tl.to(cursor, { opacity: 0, duration: 0.25, ease: "power2.out" });
      tl.to(fileList, { opacity: 0, duration: 0.3, ease: "power2.out" }, "-=0.15");

      tl.to(progressEl, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.5)" });

      // Progress 0 → 27 → 48 → 100
      const progressObj = { val: 0 };
      const updateProgress = () => {
        const pct = Math.round(progressObj.val);
        progressText.textContent = `${pct}%`;
        progressRing.style.strokeDashoffset = CIRCUMFERENCE - (progressObj.val / 100) * CIRCUMFERENCE;
      };

      tl.to(progressObj, { val: 27, duration: 0.5, ease: "power2.out", onUpdate: updateProgress });
      tl.to({}, { duration: 0.2 });
      tl.to(progressObj, { val: 48, duration: 0.4, ease: "power2.out", onUpdate: updateProgress });
      tl.to({}, { duration: 0.15 });
      tl.to(progressObj, { val: 100, duration: 0.6, ease: "power2.inOut", onUpdate: updateProgress });

      // Hold at 100%
      tl.to({}, { duration: 0.5 });

      // ── 9. Progress fades → download section appears ──
      tl.to(progressEl, { opacity: 0, scale: 0.8, duration: 0.3, ease: "power2.inOut" });

      tl.to(downloadSection, { opacity: 1, duration: 0.3, ease: "power2.out" });
      tl.to(downloadBtn, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }, "-=0.1");

      // ── 10. Cursor with "Client" bubble arrives and clicks download ──
      tl.set(cursor, { left: "40%", top: "55%", scale: 1 });
      tl.to(cursor, { opacity: 1, duration: 0.25, ease: "power2.out" });
      tl.to(cursorBubble, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }, "-=0.1");

      // Move to download button
      tl.to(cursor, { left: "26%", top: "44%", duration: 0.6, ease: "power2.inOut" });

      // Hover
      tl.to(downloadBtn, { scale: 1.03, duration: 0.15, ease: "power2.out" });

      // Click
      tl.to(cursor, { scale: 0.8, duration: 0.07, ease: "power3.in" });
      tl.to(downloadBtn, { scale: 0.97, duration: 0.07, ease: "power3.in" }, "<");
      tl.to(cursor, { scale: 1, duration: 0.15, ease: "elastic.out(1, 0.5)" });
      tl.to(downloadBtn, { scale: 1, duration: 0.15, ease: "elastic.out(1, 0.5)" }, "<");

      // ── 11. Download section fades, zoom out, images swirl out from center ──
      tl.to(downloadSection, { opacity: 0, duration: 0.3, ease: "power2.out" });
      tl.to(cursor, { opacity: 0, duration: 0.2, ease: "power2.out" }, "<");
      tl.to(cursorBubble, { opacity: 0, scale: 0.5, duration: 0.2, ease: "power2.in" }, "<");

      // Upload zone comes back
      if (uploadZoneInner) {
        tl.to(uploadZoneInner, { opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.1");
      }

      // Images swirl out from center behind device in a spiral path
      // Each orbits outward: the radius grows while the angle increases (tourbillon)
      const containerRect = container.getBoundingClientRect();
      const cw = containerRect.width;
      const ch = containerRect.height;

      // Center point (behind device center)
      const cx = cw * 0.30;
      const cy = ch * 0.30;

      // Final positions (in px from container), angle offset, total spiral angle
      const revealData = [
        // Portrait — ends top-left
        { endX: cw * -0.18, endY: ch * -0.10, startAngle: 0, totalSpin: Math.PI * 2.2, endRotation: -5 },
        // Landscape — ends top-right
        { endX: cw * 0.58, endY: ch * -0.08, startAngle: Math.PI * 0.7, totalSpin: Math.PI * 2.5, endRotation: 3 },
        // Square — ends bottom-right
        { endX: cw * 0.52, endY: ch * 0.55, startAngle: Math.PI * 1.3, totalSpin: Math.PI * 2.0, endRotation: 2 },
      ];

      const swirlLabel = "swirl";
      tl.addLabel(swirlLabel);

      // Zoom out device as images swirl
      tl.to(parentWrapper, {
        scale: 0.75,
        duration: 0.8,
        ease: "power2.inOut",
      }, swirlLabel);

      revealImgs.forEach((img, i) => {
        const d = revealData[i];
        const endX = d.endX;
        const endY = d.endY;
        // Distance from center to final position
        const dist = Math.sqrt((endX - cx) ** 2 + (endY - cy) ** 2);
        // Final angle (direction from center to end)
        const endAngle = Math.atan2(endY - cy, endX - cx);

        const swirlObj = { progress: 0 };

        tl.to(swirlObj, {
          progress: 1,
          duration: 1.3,
          ease: "power2.out",
          onStart: () => {
            gsap.set(img, { opacity: 1 });
          },
          onUpdate: () => {
            const p = swirlObj.progress;
            // Radius grows from 0 to full distance
            const radius = dist * p;
            // Angle spirals: starts from startAngle, sweeps totalSpin, ends at endAngle
            const angle = d.startAngle + d.totalSpin * (1 - p) * (1 - p) + endAngle * p * p;
            // Blend spiral position with final position for smooth landing
            const blend = p * p * p; // cubic blend — more weight to final position at end
            const spiralX = cx + Math.cos(angle) * radius;
            const spiralY = cy + Math.sin(angle) * radius;
            const x = spiralX * (1 - blend) + endX * blend;
            const y = spiralY * (1 - blend) + endY * blend;

            // Scale grows with progress
            const scale = 0.05 + p * 0.95;

            gsap.set(img, {
              left: x,
              top: y,
              scale: scale,
              rotation: d.endRotation * p,
            });
          },
        }, `${swirlLabel}+=${i * 0.12}`);
      });

      // Hold the reveal at max position
      tl.to({}, { duration: 0.8 });

      // Images swirl back to center (reverse orbit) + zoom device back
      const returnLabel = "swirlBack";
      tl.addLabel(returnLabel);

      tl.to(parentWrapper, { scale: 1, duration: 1.0, ease: "power2.inOut" }, returnLabel);

      revealImgs.forEach((img, i) => {
        const d = revealData[i];
        const endX = d.endX;
        const endY = d.endY;
        const dist = Math.sqrt((endX - cx) ** 2 + (endY - cy) ** 2);
        const endAngle = Math.atan2(endY - cy, endX - cx);

        const returnObj = { progress: 0 };

        tl.to(returnObj, {
          progress: 1,
          duration: 1.3,
          ease: "power2.in",
          onUpdate: () => {
            const p = returnObj.progress;
            // Reverse: radius shrinks from full to 0
            const radius = dist * (1 - p);
            // Continue spinning in the same direction (add more angle)
            const angle = endAngle + d.totalSpin * p * p;
            // Blend from final position to spiral, then to center
            const blend = p * p * p;
            const spiralX = cx + Math.cos(angle) * radius;
            const spiralY = cy + Math.sin(angle) * radius;
            const x = endX * (1 - blend) + spiralX * blend;
            const y = endY * (1 - blend) + spiralY * blend;

            const scale = 1 - p * 0.95;
            gsap.set(img, {
              left: x,
              top: y,
              scale: Math.max(0.05, scale),
              rotation: d.endRotation * (1 - p),
            });
          },
        }, `${returnLabel}+=${i * 0.1}`);
      });

      // ── 12. Reset ──
      tl.call(() => {
        gsap.set(cards, { opacity: 0, scale: 0.7, y: -40, left: "", top: "", rotation: "" });
        gsap.set(card1, { left: "-6%", top: "48%", rotation: -6 });
        gsap.set(card2, { left: "-3%", top: "44%", rotation: 4 });
        gsap.set(card3, { left: "-5%", top: "46%", rotation: -2 });
        gsap.set(cursor, { opacity: 0, scale: 1, left: "2%", top: "62%" });
        gsap.set(cursorBubble, { opacity: 0, scale: 0.5 });
        gsap.set(fileList, { opacity: 0 });
        gsap.set(fileRows, { opacity: 0, x: -15 });
        gsap.set(transferBtn, { opacity: 0, y: 8, scale: 1 });
        gsap.set(downloadSection, { opacity: 0 });
        gsap.set(downloadBtn, { opacity: 0, y: 8, scale: 1 });
        gsap.set(progressEl, { opacity: 0, scale: 0.5 });
        gsap.set(progressRing, { strokeDashoffset: CIRCUMFERENCE });
        progressText.textContent = "0%";
        progressObj.val = 0;
        revealImgs.forEach((img) => {
          gsap.set(img, { opacity: 0, scale: 0, left: "30%", top: "30%", rotation: 0 });
        });
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none hidden lg:block"
    >
      {/* Back layer — reveal images (behind device z-10) */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {/* Portrait tall (.psd) */}
        <div
          className="anim-reveal-img absolute rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 280, height: 380, left: "30%", top: "30%", opacity: 0, willChange: "transform, left, top" }}
        >
          <img src={files[1].src} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[8px] font-medium px-2 py-1 rounded-md">.psd</div>
        </div>
        {/* Landscape (.tiff) */}
        <div
          className="anim-reveal-img absolute rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 320, height: 220, left: "30%", top: "30%", opacity: 0, willChange: "transform, left, top" }}
        >
          <img src={files[0].src} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[8px] font-medium px-2 py-1 rounded-md">.tiff</div>
        </div>
        {/* Large square (.mov) */}
        <div
          className="anim-reveal-img absolute rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 300, height: 300, left: "30%", top: "30%", opacity: 0, willChange: "transform, left, top" }}
        >
          <img src={files[2].src} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[8px] font-medium px-2 py-1 rounded-md">.mov</div>
        </div>
      </div>

      {/* Front layer — cards, UI, cursor (above device) */}
      <div className="absolute inset-0" style={{ zIndex: 30 }}>
      {/* Stacked image cards */}
      {files.map((file, i) => (
        <div
          key={file.id}
          className="anim-card absolute rounded-xl shadow-xl border-[3px] border-white overflow-hidden"
          style={{
            width: 140, height: 200,
            left: `${-6 + i * 2}%`, top: `${48 - i * 2}%`,
            zIndex: 30 + i,
            transform: `rotate(${file.rotate}deg)`,
            opacity: 0,
          }}
        >
          <img src={file.src} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      ))}

      {/* File list */}
      <div
        className="anim-file-list absolute flex flex-col"
        style={{ left: "9%", top: "6%", width: "44%", height: "48%", zIndex: 45, opacity: 0, padding: "3% 4%" }}
      >
        <div className="flex flex-col gap-[6px] flex-1 justify-center">
          {files.map((file) => (
            <div
              key={file.id}
              className="anim-file-row flex items-center gap-2 bg-neutral-100 rounded-lg px-2.5 py-[6px]"
              style={{ opacity: 0 }}
            >
              <img src={file.src} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" draggable={false} />
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-medium text-neutral-800 truncate">{file.name}</p>
                <p className="text-[6px] text-neutral-400">{file.size}</p>
              </div>
            </div>
          ))}
        </div>
        <div
          className="anim-transfer-btn mt-4 flex items-center justify-center rounded-md py-[7px]"
          style={{ background: "#5851ff", opacity: 0 }}
        >
          <span className="text-white text-[9px] font-semibold">Transférer</span>
        </div>
      </div>

      {/* Circular progress */}
      <div
        className="anim-progress absolute flex flex-col items-center justify-center gap-3"
        style={{ left: "9%", top: "6%", width: "44%", height: "48%", zIndex: 50, opacity: 0 }}
      >
        <svg width="120" height="120" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="38" fill="none" stroke="#e5e5e5" strokeWidth="7" />
          <circle
            className="anim-progress-ring"
            cx="45" cy="45" r="38"
            fill="none" stroke="#5851ff" strokeWidth="7"
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE }}
          />
          <text
            className="anim-progress-text"
            x="45" y="49" textAnchor="middle" dominantBaseline="middle"
            fill="#5851ff" fontSize="18" fontWeight="600" fontFamily="DM Sans, sans-serif"
          >
            0%
          </text>
        </svg>
        <p className="text-[9px] font-medium text-neutral-500 text-center">Transfert en cours...</p>
        <p className="text-[7px] text-neutral-400 text-center">3 fichiers · 10.1 MB</p>
      </div>

      {/* Download section — replaces progress after 100% */}
      <div
        className="anim-download-section absolute flex flex-col items-center justify-center gap-3"
        style={{ left: "9%", top: "6%", width: "44%", height: "48%", zIndex: 50, opacity: 0 }}
      >
        {/* Download icon — same style as upload icon */}
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </div>
        <p className="text-[10px] font-semibold text-neutral-800">Vos fichiers sont prêts</p>
        <p className="text-[7px] text-neutral-400">3 fichiers · 10.1 MB</p>
        <div
          className="anim-download-btn flex items-center justify-center rounded-md py-[7px] px-6 mt-1"
          style={{ background: "#5851ff", opacity: 0 }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="text-white text-[9px] font-semibold">Télécharger</span>
        </div>
      </div>

      {/* macOS cursor + client bubble */}
      <div className="anim-cursor absolute" style={{ width: 24, height: 30, zIndex: 100, opacity: 0 }}>
        <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
          <path
            d="M2.5 1L2.5 22L7.5 17L12.5 26L16 24L11 15.5L18 15L2.5 1Z"
            fill="#1a1a1a" stroke="white" strokeWidth="1.8" strokeLinejoin="round"
          />
        </svg>
        <div
          className="anim-cursor-bubble absolute left-6 px-2.5 rounded-full whitespace-nowrap flex items-center"
          style={{ background: "#212121", opacity: 0, height: 18 }}
        >
          <span className="text-white text-[8px] font-medium leading-none">Client</span>
        </div>
      </div>
      </div>
    </div>
  );
}
