"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

function TaskCard({ title, subtasks, date, priority, priorityColor, className = "", style = {} }) {
  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 p-3 shadow-sm ${className}`}
      style={{ width: 200, ...style }}
    >
      <p className="text-[9px] font-semibold text-neutral-900 leading-tight mb-2">{title}</p>
      <div className="flex items-center gap-1.5 text-[7px] text-neutral-400 mb-1.5">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v-2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
        <span>{subtasks}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[7px] text-neutral-400 flex items-center gap-0.5">
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          {date}
        </span>
        <span className={`text-[7px] font-medium px-1.5 py-0.5 rounded ${priorityColor}`}>
          {priority}
        </span>
      </div>
    </div>
  );
}

export function KanbanDragAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cursor = container.querySelector(".anim-cursor");
    const dragCard = container.querySelector(".anim-drag-card");
    const ghostSlot = container.querySelector(".anim-ghost-slot");
    const dropSlot = container.querySelector(".anim-drop-slot");
    const counter1 = container.querySelector(".anim-counter-from");
    const counter2 = container.querySelector(".anim-counter-to");

    const ctx = gsap.context(() => {
      gsap.set(cursor, { opacity: 0 });
      gsap.set(dragCard, { opacity: 0 });
      gsap.set(ghostSlot, { opacity: 0 });
      gsap.set(dropSlot, { opacity: 0 });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2, delay: 1 });

      // Reset at start of each loop
      tl.call(() => {
        gsap.set(cursor, { opacity: 0, scale: 1 });
        gsap.set(dragCard, { opacity: 0, x: 0, y: 0, rotation: 0, scale: 1 });
        gsap.set(ghostSlot, { opacity: 0 });
        gsap.set(dropSlot, { opacity: 0 });
        if (counter1) counter1.textContent = "13";
        if (counter2) counter2.textContent = "14";
      });

      // ── 1. Cursor appears near the card in column 1 ──
      tl.call(() => {
        const cardRect = dragCard.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        gsap.set(cursor, {
          left: cardRect.left - containerRect.left + cardRect.width / 2,
          top: cardRect.top - containerRect.top + cardRect.height / 2 + 10,
        });
      });

      // Card becomes visible (in its starting position)
      tl.to(dragCard, { opacity: 1, duration: 0.3, ease: "power2.out" });
      tl.to(cursor, { opacity: 1, duration: 0.25, ease: "power2.out" }, "-=0.15");

      tl.to({}, { duration: 0.3 });

      // ── 2. Cursor grabs the card ──
      tl.to(cursor, { scale: 0.85, duration: 0.08, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      // Card lifts (scale up slightly + shadow increase)
      tl.to(dragCard, {
        scale: 1.04,
        rotation: -2,
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        duration: 0.25,
        ease: "power2.out",
      });

      // Show ghost slot (dashed placeholder where card was)
      tl.to(ghostSlot, { opacity: 1, duration: 0.2, ease: "power2.out" }, "-=0.1");

      // ── 3. Drag card to column 3 ──
      const dragDuration = 1.1;

      tl.to(cursor, {
        x: "+=320",
        y: "+=10",
        duration: dragDuration,
        ease: "power2.inOut",
      });
      tl.to(dragCard, {
        x: "+=320",
        y: "+=10",
        rotation: 1,
        duration: dragDuration,
        ease: "power2.inOut",
      }, `-=${dragDuration - 0.05}`);

      // Show drop zone highlight halfway through drag
      tl.to(dropSlot, { opacity: 1, duration: 0.3, ease: "power2.out" }, `-=${dragDuration * 0.4}`);

      // ── 4. Drop the card ──
      // Release click
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.12, ease: "elastic.out(1, 0.5)" });

      // Card settles into position
      tl.to(dragCard, {
        scale: 1,
        rotation: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        duration: 0.3,
        ease: "power2.out",
      });

      // Drop zone disappears
      tl.to(dropSlot, { opacity: 0, duration: 0.2 }, "-=0.2");

      // Ghost slot fades out
      tl.to(ghostSlot, { opacity: 0, duration: 0.2 }, "-=0.15");

      // Update counters
      tl.call(() => {
        if (counter1) counter1.textContent = "12";
        if (counter2) counter2.textContent = "15";
      });

      // Small bounce on the counters
      if (counter1) {
        tl.to(counter1, { scale: 1.3, duration: 0.1, ease: "power2.out" }, "-=0.1");
        tl.to(counter1, { scale: 1, duration: 0.15 });
      }
      if (counter2) {
        tl.to(counter2, { scale: 1.3, color: "#22c55e", duration: 0.1, ease: "power2.out" }, "-=0.2");
        tl.to(counter2, { scale: 1, color: "#737373", duration: 0.2 });
      }

      // ── 5. Cursor fades out ──
      tl.to(cursor, { opacity: 0, duration: 0.3, ease: "power2.out" }, "+=0.3");
      tl.to(dragCard, { opacity: 0, duration: 0.3, ease: "power2.out" }, "<");
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-30 hidden lg:block">
      {/* Column indicators — positioned over the image columns */}
      {/* From column counter (column 1 "Besoins") */}
      <div className="absolute" style={{ left: "16.5%", top: "14.5%" }}>
        <span className="anim-counter-from text-[10px] font-semibold text-neutral-500">13</span>
      </div>
      {/* To column counter (column 3 "Formation") */}
      <div className="absolute" style={{ left: "60.5%", top: "14.5%" }}>
        <span className="anim-counter-to text-[10px] font-semibold text-neutral-500">14</span>
      </div>

      {/* Ghost slot — dashed placeholder where card was */}
      <div
        className="anim-ghost-slot absolute rounded-xl border-2 border-dashed border-neutral-300"
        style={{
          width: 200,
          height: 85,
          left: "10.5%",
          top: "53%",
          opacity: 0,
        }}
      />

      {/* Drop slot — highlight in target column */}
      <div
        className="anim-drop-slot absolute rounded-xl border-2 border-dashed border-[#5851ff] bg-[#5851ff]/5"
        style={{
          width: 200,
          height: 85,
          left: "53.5%",
          top: "53%",
          opacity: 0,
        }}
      />

      {/* Draggable task card — starts in column 1 */}
      <div
        className="anim-drag-card absolute"
        style={{
          left: "10.5%",
          top: "53%",
          opacity: 0,
        }}
      >
        <TaskCard
          title="Sécurisation réseau et VPC"
          subtasks="1/3"
          date="25 sept."
          priority="Urgent"
          priorityColor="text-red-600 bg-red-50"
        />
      </div>

      {/* Cursor */}
      <svg
        className="anim-cursor absolute"
        style={{ width: 22, height: 28, zIndex: 100, opacity: 0 }}
        viewBox="0 0 24 30"
        fill="none"
      >
        <path
          d="M2.5 1L2.5 22L7.5 17L12.5 26L16 24L11 15.5L18 15L2.5 1Z"
          fill="#1a1a1a" stroke="white" strokeWidth="1.8" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
