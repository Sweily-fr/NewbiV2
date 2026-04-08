"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  CircleGauge,
  Landmark,
  FileText,
  Users,
  Kanban,
  FolderOpen,
  Mail,
  Search,
  Settings,
} from "lucide-react";

const columns = [
  {
    name: "Besoins",
    count: 13,
    color: "#ef4444",
    cards: [
      { title: "Optimisation coûts infrastructure", sub: "1/4", date: "3 oct.", prio: "Moyen", prioFlag: "#f59e0b" },
      { title: "Migration serveurs vers AWS ECS", sub: "0/3", date: "24 sept.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Sécurisation réseau et VPC", sub: "1/3", date: "25 sept.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Setup cluster Kubernetes produ...", sub: "3/5", date: "28 sept.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Stratégie backup multi-région", sub: "3/5", date: "23 sept.", prio: "Urgent", prioFlag: "#ef4444" },
    ],
  },
  {
    name: "Préparation",
    count: 15,
    color: "#f59e0b",
    cards: [
      { title: "Disaster recovery plan", sub: "2/5", date: "24 sept.", prio: "Moyen", prioFlag: "#f59e0b" },
      { title: "Auto-scaling policies optimisées", sub: "2/4", date: "13 oct.", prio: "Faible", prioFlag: "#22c55e" },
      { title: "Migration serveurs vers AWS ECS", sub: "0/3", date: "13 oct.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Sécurisation réseau et VPC", sub: "2/3", date: "21 sept.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Setup cluster Kubernetes produ...", sub: "3/3", date: "17 oct.", prio: "Urgent", prioFlag: "#ef4444" },
    ],
  },
  {
    name: "Formation",
    count: 14,
    color: "#3b82f6",
    cards: [
      { title: "Optimisation coûts infrastructure", sub: "2/3", date: "11 oct.", prio: "Moyen", prioFlag: "#f59e0b" },
      { title: "Optimisation coûts infrastructure", sub: "5/5", date: "22 sept.", prio: "Moyen", prioFlag: "#f59e0b" },
      { title: "Auto-scaling policies optimisées", sub: "0/3", date: "27 sept.", prio: "Faible", prioFlag: "#22c55e" },
      { title: "Migration serveurs vers AWS ECS", sub: "0/5", date: "24 sept.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Sécurisation réseau et VPC", sub: "1/3", date: "25 sept.", prio: "Urgent", prioFlag: "#ef4444" },
    ],
  },
  {
    name: "Évaluation",
    count: 12,
    color: "#22c55e",
    cards: [
      { title: "Database clustering et réplicati...", sub: "1/3", date: "18 oct.", prio: "Urgent", prioFlag: "#ef4444" },
      { title: "Disaster recovery plan", sub: "0/3", date: "21 sept.", prio: "Moyen", prioFlag: "#f59e0b" },
      { title: "Auto-scaling policies optimisées", sub: "2/5", date: "25 sept.", prio: "Faible", prioFlag: "#22c55e" },
      { title: "Optimisation coûts infrastructure", sub: "0/4", date: "5 oct.", prio: "Moyen", prioFlag: "#f59e0b" },
    ],
  },
];

function TaskCard({ title, sub, date, prio, prioFlag, isTarget = false, className = "" }) {
  return (
    <div className={`kanban-card bg-white rounded-xl border border-[#eeeff1] px-4 py-2.5 shadow-[0_1px_2px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_1px_2px_-2px_rgba(0,0,0,0.1)] transition-shadow cursor-pointer ${className}`}>
      <p className="text-[13px] font-medium text-[#242529] leading-5 truncate mb-1">{title}</p>
      <div className="flex items-center gap-2 text-[11px] text-[#606164] mb-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /></svg>
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
          <span>{sub}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 py-1 px-2 text-[11px] font-medium rounded-md border border-[#eeeff1] text-[#606164]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          {date}
        </div>
        <div
          className={`inline-flex items-center gap-1 py-1 px-2 text-[11px] font-medium rounded-md border border-[#eeeff1] ${isTarget ? "anim-target-prio" : ""}`}
          style={isTarget ? { color: "#ef4444" } : { color: prioFlag }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
          <span>{isTarget ? "Urgent" : prio}</span>
        </div>
      </div>
    </div>
  );
}

function SidebarIcon({ children, active = false }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-[#5A50FF]/10" : "hover:bg-[#f5f5f5]"}`}>
      <div className={active ? "text-[#5A50FF]" : "text-[#a0a0a0]"}>{children}</div>
    </div>
  );
}

export function KanbanBoard() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cursor = container.querySelector(".anim-cursor");
    const newCard = container.querySelector(".anim-new-card");
    const newCardTitle = container.querySelector(".anim-new-title");
    const typedText = container.querySelector(".anim-typed-text");
    const typeCursor = container.querySelector(".anim-type-cursor");
    const newToolbar = container.querySelector(".anim-new-toolbar");
    const newCardMeta = container.querySelector(".anim-new-meta");
    const newCardPrio = container.querySelector(".anim-new-prio");
    const colAddBtn = container.querySelector(".anim-col-add-btn");
    const boardWrapper = container.querySelector(".anim-board-content");
    const dragCard = container.querySelector(".anim-drag-card");
    const ghostSlot = container.querySelector(".anim-ghost-slot");
    const dropSlot = container.querySelector(".anim-drop-slot");
    const col1Count = container.querySelector(".col-count-0");
    const col2Count = container.querySelector(".col-count-1");
    const contextMenu = container.querySelector(".anim-context-menu");
    const targetPrioBadge = container.querySelector(".anim-target-prio");
    const droppedCard = container.querySelector(".anim-dropped-card");
    const addBtn = container.querySelector(".anim-add-btn");

    const ctx = gsap.context(() => {
      gsap.set(cursor, { opacity: 0 });
      gsap.set(newCard, { opacity: 0, height: 0, marginBottom: 0 });
      gsap.set([newCardTitle, newCardMeta, newCardPrio, newToolbar], { opacity: 0 });
      gsap.set(typeCursor, { opacity: 0 });
      if (typedText) typedText.textContent = "";
      gsap.set(dragCard, { opacity: 0 });
      gsap.set(ghostSlot, { opacity: 0, height: 0, marginBottom: 0 });
      gsap.set(dropSlot, { opacity: 0, height: 0, marginBottom: 0 });
      gsap.set(contextMenu, { opacity: 0, scale: 0.9 });
      gsap.set(droppedCard, { opacity: 0, height: 0, marginBottom: 0 });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5, delay: 1 });

      // Reset
      tl.call(() => {
        gsap.set(cursor, { opacity: 0, scale: 1, x: 0, y: 0 });
        gsap.set(newCard, { opacity: 0, height: 0, marginBottom: 0 });
        gsap.set([newCardTitle, newCardMeta, newCardPrio, newToolbar], { opacity: 0, scale: 1 });
        gsap.set(typeCursor, { opacity: 0 });
        gsap.set(container, { scale: 1 });
        if (typedText) typedText.textContent = "";
        gsap.set(dragCard, { opacity: 0, x: 0, y: 0, scale: 1, rotation: 0 });
        gsap.set(ghostSlot, { opacity: 0, height: 0, marginBottom: 0 });
        gsap.set(dropSlot, { opacity: 0, height: 0, marginBottom: 0 });
        gsap.set(contextMenu, { opacity: 0, scale: 0.9 });
        gsap.set(droppedCard, { opacity: 0, height: 0, marginBottom: 0 });
        if (col1Count) col1Count.textContent = "13";
        if (col2Count) col2Count.textContent = "15";
        if (targetPrioBadge) {
          targetPrioBadge.textContent = "Urgent";
          gsap.set(targetPrioBadge, { color: "#ef4444" });
        }
      });

      // ═══════════════════════════════════
      // PHASE 1 — Create task
      // ═══════════════════════════════════

      // Cursor appears from the right and moves to the + button
      tl.call(() => {
        const btn = colAddBtn.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        // Start position: far right
        gsap.set(cursor, { left: cr.width - 30, top: btn.top - cr.top + 2, right: "auto" });
      });
      tl.to(cursor, { opacity: 1, duration: 0.2, ease: "power2.out" });

      // Move to the + button
      tl.call(() => {
        const btn = colAddBtn.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.to(cursor, { left: btn.left - cr.left + 2, top: btn.top - cr.top + 2, duration: 0.6, ease: "power2.inOut" });
      });
      tl.to({}, { duration: 0.6 });

      // Click the + button
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      // Board bounces on click (scale rebound like transfers)
      tl.to(container, { scale: 1.015, duration: 0.1, ease: "power2.out" }, "-=0.1");
      tl.to(container, { scale: 0.997, duration: 0.12, ease: "power2.inOut" });
      tl.to(container, { scale: 1, duration: 0.15, ease: "power2.out" });

      // Card opens in column
      tl.to(newCard, { opacity: 1, height: "auto", marginBottom: 8, duration: 0.4, ease: "power2.out" }, "-=0.1");
      tl.to(cursor, { opacity: 0, duration: 0.15 });

      // Zoom into the card area (whole interface)
      tl.to(container, {
        scale: 1.35, transformOrigin: "15% 30%",
        duration: 0.7, ease: "power2.inOut",
      });

      // Show title area with typing cursor blinking
      tl.to(newCardTitle, { opacity: 1, duration: 0.1 });
      tl.to(typeCursor, { opacity: 1, duration: 0.1 });

      // Show mini toolbar (editing bar)
      tl.to(newToolbar, { opacity: 1, duration: 0.2, ease: "power2.out" });

      // Typing animation — letter by letter
      const titleText = "Monitoring alertes Datadog";
      const typeLabel = "typing";
      tl.addLabel(typeLabel);

      // Blink the cursor during typing
      tl.to(typeCursor, {
        opacity: 0, duration: 0.3,
        repeat: Math.ceil(titleText.length / 3),
        yoyo: true,
        ease: "steps(1)",
      }, typeLabel);

      // Type each letter
      titleText.split("").forEach((char, i) => {
        tl.call(() => {
          if (typedText) typedText.textContent = titleText.substring(0, i + 1);
        }, null, `${typeLabel}+=${i * 0.06}`);
      });

      // Wait for typing to finish
      tl.to({}, { duration: titleText.length * 0.06 + 0.2 }, typeLabel);

      // Typing cursor stops blinking, stays visible briefly
      tl.to(typeCursor, { opacity: 1, duration: 0.05 });
      tl.to({}, { duration: 0.2 });

      // Hide toolbar + cursor, show meta
      tl.to(newToolbar, { opacity: 0, duration: 0.15 });
      tl.to(typeCursor, { opacity: 0, duration: 0.1 }, "<");

      // Meta row appears
      tl.to(newCardMeta, { opacity: 1, duration: 0.2, ease: "power2.out" });

      // Priority badge bounces in
      tl.to(newCardPrio, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" });

      tl.to({}, { duration: 0.2 });

      // Update counter
      tl.call(() => { if (col1Count) col1Count.textContent = "14"; });
      tl.to(col1Count, { scale: 1.3, duration: 0.1, ease: "back.out(2)" });
      tl.to(col1Count, { scale: 1, duration: 0.15 });

      // ═══════════════════════════════════
      // PHASE 2 — Drag to column 2
      // ═══════════════════════════════════

      // Zoom back out as drag begins
      tl.to(container, {
        scale: 1,
        duration: 0.7, ease: "power2.inOut",
      });

      tl.to({}, { duration: 0.1 });

      tl.call(() => {
        const cardRect = newCard.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.set(cursor, {
          left: cardRect.left - cr.left + cardRect.width / 2,
          top: cardRect.top - cr.top + cardRect.height / 2 + 6,
          x: 0, y: 0, opacity: 0,
        });
      });
      tl.to(cursor, { opacity: 1, duration: 0.2 });

      // Grab
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      // Show floating drag card, hide original
      tl.call(() => {
        const cardRect = newCard.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.set(dragCard, {
          left: cardRect.left - cr.left,
          top: cardRect.top - cr.top,
          opacity: 1, scale: 1.03, rotation: -1.5,
        });
      });
      tl.to(newCard, { opacity: 0, height: 0, marginBottom: 0, duration: 0.15 });
      tl.to(ghostSlot, { opacity: 1, height: 75, marginBottom: 8, duration: 0.2 });
      tl.to(dropSlot, { opacity: 1, height: 75, marginBottom: 8, duration: 0.25 }, "-=0.1");

      // Drag
      tl.to(cursor, { x: "+=230", duration: 1.0, ease: "power2.inOut" });
      tl.to(dragCard, { x: "+=230", rotation: 1, duration: 1.0, ease: "power2.inOut" }, "-=0.96");

      // Drop
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.12, ease: "elastic.out(1, 0.5)" });
      tl.to(dragCard, { scale: 1, rotation: 0, duration: 0.25, ease: "power2.out" });
      tl.to(ghostSlot, { opacity: 0, height: 0, marginBottom: 0, duration: 0.2 }, "-=0.15");
      tl.to(dropSlot, { opacity: 0, height: 0, marginBottom: 0, duration: 0.2 }, "<");
      tl.to(dragCard, { opacity: 0, duration: 0.15 });

      // Card appears in column 2
      tl.to(droppedCard, { opacity: 1, height: "auto", marginBottom: 8, duration: 0.3, ease: "back.out(1.5)" }, "-=0.1");

      tl.call(() => {
        if (col1Count) col1Count.textContent = "13";
        if (col2Count) col2Count.textContent = "16";
      });
      tl.to(col2Count, { scale: 1.3, color: "#22c55e", duration: 0.1, ease: "back.out(2)" });
      tl.to(col2Count, { scale: 1, color: "#606164", duration: 0.2 });

      // ═══════════════════════════════════
      // PHASE 3 — Change priority
      // ═══════════════════════════════════
      tl.to({}, { duration: 0.3 });

      const menuItem0 = container.querySelector(".anim-menu-item-0");
      const menuItem1 = container.querySelector(".anim-menu-item-1");
      const menuItem2 = container.querySelector(".anim-menu-item-2");

      // Cursor moves precisely to the Urgent badge on the target card
      tl.call(() => {
        if (!targetPrioBadge) return;
        const r = targetPrioBadge.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.set(cursor, { left: r.left - cr.left + 2, top: r.top - cr.top + 2, x: 0, y: 0 });
      });
      tl.to(cursor, { opacity: 1, duration: 0.2 });

      // Click on badge
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      // Context menu appears
      tl.to(contextMenu, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(1.7)" });
      tl.to({}, { duration: 0.2 });

      // Cursor moves to "Urgent" item (hover it)
      tl.call(() => {
        const r = menuItem0.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.to(cursor, { left: r.left - cr.left + 2, top: r.top - cr.top + 2, duration: 0.25, ease: "power2.inOut" });
      });
      tl.to({}, { duration: 0.25 });
      // Hover bg on Urgent
      tl.to(menuItem0, { backgroundColor: "#f5f5f5", duration: 0.1 });
      tl.to({}, { duration: 0.15 });

      // Move to "Moyen" (hover it, unhover previous)
      tl.call(() => {
        const r = menuItem1.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.to(cursor, { left: r.left - cr.left + 2, top: r.top - cr.top + 2, duration: 0.2, ease: "power2.inOut" });
      });
      tl.to(menuItem0, { backgroundColor: "transparent", duration: 0.1 });
      tl.to({}, { duration: 0.2 });
      tl.to(menuItem1, { backgroundColor: "#f5f5f5", duration: 0.1 });
      tl.to({}, { duration: 0.15 });

      // Move to "Faible" (hover it, unhover previous)
      tl.call(() => {
        const r = menuItem2.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        gsap.to(cursor, { left: r.left - cr.left + 2, top: r.top - cr.top + 2, duration: 0.2, ease: "power2.inOut" });
      });
      tl.to(menuItem1, { backgroundColor: "transparent", duration: 0.1 });
      tl.to({}, { duration: 0.2 });
      tl.to(menuItem2, { backgroundColor: "#f5f5f5", duration: 0.1 });
      tl.to({}, { duration: 0.15 });

      // Click on "Faible"
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      // Badge changes color
      tl.to(targetPrioBadge, { color: "#22c55e", duration: 0.3, ease: "power2.out" });
      tl.call(() => { if (targetPrioBadge) targetPrioBadge.textContent = "Faible"; });

      // Menu closes, reset hover
      tl.to(menuItem2, { backgroundColor: "transparent", duration: 0.1 });
      tl.to(contextMenu, { opacity: 0, scale: 0.9, duration: 0.2, ease: "power2.in" });

      // Cursor fades out
      tl.to(cursor, { opacity: 0, duration: 0.2, ease: "power2.out" }, "+=0.3");
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative bg-white rounded-[2rem] overflow-hidden" style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif", border: "12px solid #2F2F2D" }}>
      {/* ── Sidebar ── */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#fafafa] border-r border-[#eeeff1] flex flex-col items-center py-3 gap-1 z-20">
        <div className="mb-3">
          <img src="/newbi-icon.svg" alt="Newbi" className="w-7 h-7" />
        </div>
        <SidebarIcon><CircleGauge size={16} /></SidebarIcon>
        <SidebarIcon><Landmark size={16} /></SidebarIcon>
        <SidebarIcon><FileText size={16} /></SidebarIcon>
        <SidebarIcon><Users size={16} /></SidebarIcon>
        <SidebarIcon active><Kanban size={16} /></SidebarIcon>
        <SidebarIcon><FolderOpen size={16} /></SidebarIcon>
        <SidebarIcon><Mail size={16} /></SidebarIcon>
        <div className="flex-1" />
        <SidebarIcon><Search size={16} /></SidebarIcon>
        <SidebarIcon><Settings size={16} /></SidebarIcon>
        <div className="mt-1">
          <img
            src="/images/kanban-demo-avatar.jpg"
            alt="Avatar"
            className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#eeeff1]"
          />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="ml-12">
        {/* Header row 1 */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[#eeeff1]">
          <span className="text-[11px] text-[#a0a0a0]">Projets</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="text-[13px] font-semibold text-[#242529]">Refonte Infrastructure</span>
          <span className="text-[11px] text-[#a0a0a0] truncate max-w-[180px] hidden sm:inline">Migration vers le cloud et modernis...</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-amber-200 ring-1 ring-white" />
              <div className="w-5 h-5 rounded-full bg-blue-200 ring-1 ring-white" />
            </div>
          </div>
        </div>

        {/* Header row 2 — Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-[#eeeff1]">
          <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[12px] font-normal text-[#606164]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="#606164" opacity="0.9" /><rect x="2" y="7" width="9" height="1.5" rx="0.75" fill="#606164" opacity="0.6" /><rect x="2" y="11" width="6" height="1.5" rx="0.75" fill="#606164" opacity="0.35" /></svg>
            List
          </div>
          <div className="relative flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[12px] font-semibold text-[#242529] bg-[#fbfbfb] shadow-[inset_0_0_0_1px_#eeeff1]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="4" height="12" rx="1" fill="#7B68EE" opacity="0.9" /><rect x="6" y="2" width="4" height="12" rx="1" fill="#7B68EE" opacity="0.6" /><rect x="11" y="2" width="4" height="12" rx="1" fill="#7B68EE" opacity="0.35" /></svg>
            Board
            <div className="absolute inset-x-1 -bottom-[9px] h-px bg-[#242529] rounded-full" />
          </div>
          <div className="anim-gantt-tab flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[12px] font-normal text-[#606164] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="8" height="3" rx="1" fill="#E8723A" opacity="0.9" /><rect x="4" y="7" width="10" height="3" rx="1" fill="#E8723A" opacity="0.6" /><rect x="3" y="12" width="6" height="3" rx="1" fill="#E8723A" opacity="0.35" /></svg>
            Gantt
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-md border border-[#eeeff1] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <div className="w-7 h-7 rounded-md border border-[#eeeff1] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </div>
            <div className="anim-add-btn w-7 h-7 rounded-full bg-[#5A50FF] flex items-center justify-center cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
          </div>
        </div>

        {/* ── Board content ── */}
        <div className="anim-board-content">
          <div className="flex gap-2.5 p-3 overflow-hidden" style={{ height: 540 }}>
            {columns.map((col, ci) => (
              <div
                key={ci}
                className="flex flex-col gap-2 rounded-xl p-1.5 flex-shrink-0"
                style={{ minWidth: 230, maxWidth: 230, backgroundColor: `${col.color}08` }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-2 pt-0.5 mb-0.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border" style={{ backgroundColor: `${col.color}15`, borderColor: `${col.color}20`, color: col.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.name}
                  </div>
                  <span className={`col-count-${ci} text-[12px] font-medium`} style={{ color: "#606164" }}>{col.count}</span>
                  {ci === 0 && (
                    <div className="anim-col-add-btn ml-auto w-5 h-5 rounded-md flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5]" style={{ color: col.color }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </div>
                  )}
                </div>

                {/* New card slot (col 1 only) */}
                {ci === 0 && (
                  <>
                    <div className="anim-new-card rounded-xl border border-[#eeeff1] bg-white shadow-[0_1px_2px_-2px_rgba(0,0,0,0.05)] px-4 py-2.5" style={{ opacity: 0, height: 0, marginBottom: 0 }}>
                      <div className="anim-new-title flex items-center mb-1" style={{ opacity: 0 }}>
                        <span className="anim-typed-text text-[13px] font-medium text-[#242529] leading-5"></span>
                        <span className="anim-type-cursor inline-block w-[1.5px] h-[14px] bg-[#5A50FF] ml-[1px]" style={{ opacity: 0 }} />
                      </div>
                      <div className="anim-new-toolbar flex items-center gap-1.5 mb-1.5" style={{ opacity: 0 }}>
                        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-[#eeeff1]">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </div>
                        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-[#eeeff1]">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>
                        </div>
                        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-[#eeeff1]">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                        </div>
                      </div>
                      <div className="anim-new-meta flex items-center gap-2 text-[11px] text-[#606164] mb-1.5" style={{ opacity: 0 }}>
                        <div className="w-4 h-4 rounded-full bg-[#5A50FF] flex items-center justify-center">
                          <span className="text-white text-[7px] font-bold">L</span>
                        </div>
                        <span>Léa M.</span>
                        <span className="text-[#a0a0a0]">·</span>
                        <span>12 oct.</span>
                      </div>
                      <div className="anim-new-prio inline-flex items-center gap-1 py-1 px-2 text-[11px] font-medium rounded-md border border-[#eeeff1]" style={{ color: "#ef4444", opacity: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                        Urgent
                      </div>
                    </div>
                    <div className="anim-ghost-slot rounded-xl border-2 border-dashed border-[#d4d4d4]" style={{ opacity: 0, height: 0, marginBottom: 0 }} />
                  </>
                )}
                {ci === 1 && (
                  <>
                    <div className="anim-drop-slot rounded-xl border-2 border-dashed border-[#5A50FF] bg-[#5A50FF]/5" style={{ opacity: 0, height: 0, marginBottom: 0 }} />
                    <div className="anim-dropped-card rounded-xl border border-[#eeeff1] bg-white shadow-[0_1px_2px_-2px_rgba(0,0,0,0.05)] px-4 py-2.5" style={{ opacity: 0, height: 0, marginBottom: 0 }}>
                      <p className="text-[13px] font-medium text-[#242529] leading-5 truncate mb-1">Monitoring alertes Datadog</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#606164] mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#5A50FF] flex items-center justify-center">
                          <span className="text-white text-[7px] font-bold">L</span>
                        </div>
                        <span>Léa M.</span>
                        <span className="text-[#a0a0a0]">·</span>
                        <span>12 oct.</span>
                      </div>
                      <div className="inline-flex items-center gap-1 py-1 px-2 text-[11px] font-medium rounded-md border border-[#eeeff1]" style={{ color: "#ef4444" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                        Urgent
                      </div>
                    </div>
                  </>
                )}

                {/* Cards */}
                {col.cards.map((card, j) => (
                  <TaskCard key={j} {...card} isTarget={ci === 2 && j === 0} />
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Floating drag card ── */}
      <div className="anim-drag-card absolute z-40 bg-white rounded-xl border border-[#eeeff1] px-4 py-2.5 shadow-lg" style={{ width: 220, opacity: 0 }}>
        <p className="text-[13px] font-medium text-[#242529] leading-5 mb-1">Monitoring alertes Datadog</p>
        <div className="flex items-center gap-2 text-[11px] text-[#606164] mb-1.5">
          <div className="w-4 h-4 rounded-full bg-[#5A50FF] flex items-center justify-center">
            <span className="text-white text-[7px] font-bold">L</span>
          </div>
          <span>Léa M.</span>
          <span className="text-[#a0a0a0]">·</span>
          <span>12 oct.</span>
        </div>
        <div className="inline-flex items-center gap-1 py-1 px-2 text-[11px] font-medium rounded-md border border-[#eeeff1]" style={{ color: "#ef4444" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
          Urgent
        </div>
      </div>

      {/* ── Context menu ── */}
      <div className="anim-context-menu absolute z-40 bg-white rounded-xl shadow-lg border border-[#eeeff1] py-1.5 px-1" style={{ width: 130, opacity: 0, left: "52%", top: "38%" }}>
        <div className="anim-menu-item-0 flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="#ef4444" strokeWidth="1.5" fill="none" /></svg>
          <span className="text-[11px] font-medium" style={{ color: "#ef4444" }}>Urgent</span>
        </div>
        <div className="anim-menu-item-1 flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="#f59e0b" strokeWidth="1.5" fill="none" /></svg>
          <span className="text-[11px] font-medium" style={{ color: "#f59e0b" }}>Moyen</span>
        </div>
        <div className="anim-menu-item-2 flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" stroke="#22c55e" strokeWidth="1.5" fill="none" /></svg>
          <span className="text-[11px] font-medium" style={{ color: "#22c55e" }}>Faible</span>
        </div>
      </div>

      {/* ── Cursor ── */}
      <svg className="anim-cursor absolute z-50 pointer-events-none" style={{ width: 22, height: 28, opacity: 0 }} viewBox="0 0 24 30" fill="none">
        <path d="M2.5 1L2.5 22L7.5 17L12.5 26L16 24L11 15.5L18 15L2.5 1Z" fill="#1a1a1a" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
