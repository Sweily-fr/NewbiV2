"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function InvoiceEditorAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const invoice = container.querySelector(".anim-invoice");
    const uploadCard = container.querySelector(".anim-upload-card");
    const uploadZone = container.querySelector(".anim-upload-zone");
    const cursor = container.querySelector(".anim-cursor");
    const logoDrag = container.querySelector(".anim-logo-drag");
    const logoOnInvoice = container.querySelector(".anim-logo-placed");
    const colorCard = container.querySelector(".anim-color-card");
    const colorDots = container.querySelectorAll(".anim-color-dot");
    const invoiceHeader = container.querySelector(".anim-inv-header");
    const invoiceTotal = container.querySelector(".anim-inv-total");

    // Get real positions dynamically
    function getPos(el) {
      const r = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    }

    const ctx = gsap.context(() => {
      gsap.set(invoice, { x: 140, opacity: 0 });
      gsap.set(uploadCard, { x: -60, opacity: 0 });
      gsap.set(cursor, { opacity: 0 });
      gsap.set(logoDrag, { opacity: 0 });
      gsap.set(logoOnInvoice, { opacity: 0, scale: 0.5 });
      gsap.set(colorCard, { x: -60, opacity: 0 });
      gsap.set(invoiceHeader, { backgroundColor: "#5851ff" });
      gsap.set(invoiceTotal, { backgroundColor: "rgba(88,81,255,0.1)" });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 0.3 });

      // Reset at start of each loop
      tl.call(() => {
        gsap.set(invoice, { x: 140, opacity: 0 });
        gsap.set(uploadCard, { x: -60, opacity: 0 });
        gsap.set(cursor, { opacity: 0, scale: 1 });
        gsap.set(logoDrag, { opacity: 0 });
        gsap.set(logoOnInvoice, { opacity: 0, scale: 0.5 });
        gsap.set(colorCard, { x: -60, opacity: 0 });
        gsap.set(uploadZone, { borderColor: "#d4d4d4", backgroundColor: "#ffffff" });
        gsap.set(invoiceHeader, { backgroundColor: "#5851ff" });
        gsap.set(invoiceTotal, { backgroundColor: "rgba(88,81,255,0.1)" });
        gsap.set(colorDots, { scale: 1 });
      });

      // ── 1. Invoice slides in ──
      tl.to(invoice, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" });

      // ── 2. Upload card appears ──
      tl.to(uploadCard, { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, "-=0.2");
      tl.to({}, { duration: 0.3 });

      // ── 3. Cursor + logo appear from far left, drag to upload zone dashed area ──
      tl.call(() => {
        const uploadPos = getPos(uploadZone);
        gsap.set(cursor, { left: uploadPos.x - 140, top: uploadPos.y + 15 });
        gsap.set(logoDrag, { left: uploadPos.x - 150, top: uploadPos.y });
      });

      // Cursor + logo fade in
      tl.to(cursor, { opacity: 1, duration: 0.2, ease: "power2.out" });
      tl.to(logoDrag, { opacity: 0.9, duration: 0.15, ease: "power2.out" }, "<");

      // Drag toward the dashed upload zone
      tl.call(() => {
        const uploadPos = getPos(uploadZone);
        gsap.to(cursor, { left: uploadPos.x + 5, top: uploadPos.y + 10, duration: 0.8, ease: "power2.inOut" });
        gsap.to(logoDrag, { left: uploadPos.x - 10, top: uploadPos.y - 5, duration: 0.8, ease: "power2.inOut" });
      });
      tl.to({}, { duration: 0.5 });

      // Upload zone highlights as cursor approaches
      tl.to(uploadZone, { borderColor: "#5851ff", backgroundColor: "#f0eeff", duration: 0.2 });
      tl.to({}, { duration: 0.3 });

      // ── 4. Drop logo on the dashed zone ──
      // Cursor release click
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });

      // Logo shrinks into the zone and disappears
      tl.to(logoDrag, { opacity: 0, scale: 0.3, duration: 0.2, ease: "power2.in" });
      tl.to(cursor, { opacity: 0, duration: 0.2, ease: "power2.in" }, "-=0.1");

      // Upload zone turns green (success)
      tl.to(uploadZone, { borderColor: "#22c55e", backgroundColor: "#f0fdf4", duration: 0.25 });

      // ── 5. Logo appears on the invoice ──
      tl.to(logoOnInvoice, { opacity: 1, scale: 1.15, duration: 0.3, ease: "back.out(2)" });
      tl.to(logoOnInvoice, { scale: 1, duration: 0.15, ease: "power2.out" });

      tl.to({}, { duration: 0.3 });
      tl.to(uploadZone, { borderColor: "#d4d4d4", backgroundColor: "#ffffff", duration: 0.3 });

      // ── 6. Upload card out → color card in ──
      tl.to(uploadCard, { x: -60, opacity: 0, duration: 0.35, ease: "power2.in" });
      tl.to(colorCard, { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, "-=0.15");
      tl.to({}, { duration: 0.3 });

      // ── 7. Cursor clicks color dots ──
      // Click violet dot (first)
      tl.call(() => {
        const dotPos = getPos(colorDots[0]);
        gsap.set(cursor, { left: dotPos.x + 5, top: dotPos.y + 8, scale: 1, opacity: 0 });
      });
      tl.to(cursor, { opacity: 1, duration: 0.2 });
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });
      tl.to(colorDots[0], { scale: 1.3, duration: 0.1, ease: "back.out(2)" }, "-=0.1");
      tl.to(colorDots[0], { scale: 1, duration: 0.15 });

      tl.to({}, { duration: 0.35 });

      // Move to amber dot and click
      tl.call(() => {
        const dotPos = getPos(colorDots[1]);
        gsap.to(cursor, { left: dotPos.x + 5, top: dotPos.y + 8, duration: 0.35, ease: "power2.inOut" });
      });
      tl.to({}, { duration: 0.35 });
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });
      tl.to(invoiceHeader, { backgroundColor: "#F59E0B", duration: 0.3, ease: "power2.out" }, "-=0.15");
      tl.to(invoiceTotal, { backgroundColor: "rgba(245,158,11,0.1)", duration: 0.3, ease: "power2.out" }, "<");
      tl.to(colorDots[1], { scale: 1.3, duration: 0.1, ease: "back.out(2)" }, "-=0.3");
      tl.to(colorDots[1], { scale: 1, duration: 0.15 });

      tl.to({}, { duration: 0.4 });

      // Move to green dot and click
      tl.call(() => {
        const dotPos = getPos(colorDots[2]);
        gsap.to(cursor, { left: dotPos.x + 5, top: dotPos.y + 8, duration: 0.35, ease: "power2.inOut" });
      });
      tl.to({}, { duration: 0.35 });
      tl.to(cursor, { scale: 0.85, duration: 0.06, ease: "power3.in" });
      tl.to(cursor, { scale: 1, duration: 0.1, ease: "power2.out" });
      tl.to(invoiceHeader, { backgroundColor: "#22c55e", duration: 0.3, ease: "power2.out" }, "-=0.15");
      tl.to(invoiceTotal, { backgroundColor: "rgba(34,197,94,0.1)", duration: 0.3, ease: "power2.out" }, "<");
      tl.to(colorDots[2], { scale: 1.3, duration: 0.1, ease: "back.out(2)" }, "-=0.3");
      tl.to(colorDots[2], { scale: 1, duration: 0.15 });

      tl.to({}, { duration: 0.5 });

      // ── 8. Everything out ──
      tl.to(cursor, { opacity: 0, duration: 0.2, ease: "power2.out" });
      tl.to(colorCard, { x: -60, opacity: 0, duration: 0.35, ease: "power2.in" }, "-=0.1");
      tl.to(invoice, { x: 150, opacity: 0, duration: 0.5, ease: "power2.in" });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Invoice */}
      <div
        className="anim-invoice absolute right-5 top-8 z-10 bg-white w-[300px] min-h-[340px] p-5 text-[7px] leading-relaxed shadow-lg border border-neutral-100"
        style={{ opacity: 0 }}
      >
        <div className="anim-logo-placed absolute top-4 left-4" style={{ opacity: 0 }}>
          <img src="/newbiLetter.png" alt="Newbi" className="h-3 w-auto object-contain" />
        </div>
        <div className="text-right mb-3">
          <p className="text-[10px] font-bold text-neutral-900">Facture</p>
          <p className="text-neutral-500 mt-0.5">N° de facture: F-042026-0001</p>
          <p className="text-neutral-500">Date d&apos;émission: 03/04/2026</p>
          <p className="text-neutral-500">Date d&apos;échéance: 03/05/2026</p>
        </div>
        <div className="mb-3">
          <p className="font-semibold text-neutral-900 text-[7px]">Newbi Demo</p>
          <p className="text-neutral-500">42 Avenue des Entrepreneurs</p>
          <p className="text-neutral-500">75008 Paris, France</p>
          <p className="text-neutral-500">contact@demo-newbi.fr</p>
          <p className="text-neutral-500">SIRET: 12345678901234</p>
        </div>
        <div className="mb-2">
          <div className="anim-inv-header flex text-white rounded-[2px] px-1 py-0.5 text-[5px] font-medium">
            <span className="flex-1">Description</span>
            <span className="w-8 text-center">Qté</span>
            <span className="w-12 text-center">Prix unit.</span>
            <span className="w-8 text-center">TVA</span>
            <span className="w-12 text-right">Total HT</span>
          </div>
          <div className="flex px-1 py-1 text-[5px] border-b border-neutral-100">
            <span className="flex-1 text-neutral-700">Audit SEO</span>
            <span className="w-8 text-center text-neutral-500">1</span>
            <span className="w-12 text-center text-neutral-500">1 200 €</span>
            <span className="w-8 text-center text-neutral-500">20%</span>
            <span className="w-12 text-right text-neutral-900 font-medium">1 200 €</span>
          </div>
          <div className="flex px-1 py-1 text-[5px] border-b border-neutral-100">
            <span className="flex-1 text-neutral-700">Audit UX</span>
            <span className="w-8 text-center text-neutral-500">1</span>
            <span className="w-12 text-center text-neutral-500">1 200 €</span>
            <span className="w-8 text-center text-neutral-500">20%</span>
            <span className="w-12 text-right text-neutral-900 font-medium">1 200 €</span>
          </div>
        </div>
        <div className="text-right text-[5px] space-y-0.5">
          <div className="flex justify-end gap-4">
            <span className="text-neutral-500">Total HT</span>
            <span className="font-medium text-neutral-900">2 400 €</span>
          </div>
          <div className="flex justify-end gap-4">
            <span className="text-neutral-500">TVA 20%</span>
            <span className="text-neutral-900">480 €</span>
          </div>
          <div className="anim-inv-total flex justify-end gap-4 rounded-[2px] px-1 py-0.5">
            <span className="font-semibold text-neutral-900">Total TTC</span>
            <span className="font-bold text-neutral-900">2 880 €</span>
          </div>
        </div>
      </div>

      {/* Upload card */}
      <div
        className="anim-upload-card absolute top-10 left-2 z-20 w-[170px] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2"
        style={{ opacity: 0 }}
      >
        <p className="text-[8px] font-semibold text-neutral-800">Votre logo</p>
        <div className="anim-upload-zone rounded-lg border border-dashed border-neutral-300 p-3 flex flex-col items-center gap-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span className="text-[5px] text-neutral-400 text-center leading-tight">Glissez votre logo ici<br />ou</span>
        </div>
        <div className="bg-[#202020] text-white text-[7px] font-medium py-1.5 px-3 rounded-md text-center">Upload</div>
      </div>

      {/* Dragged logo */}
      <div className="anim-logo-drag absolute z-30 pointer-events-none" style={{ opacity: 0 }}>
        <img src="/newbiLetter.png" alt="" className="h-5 w-auto object-contain" />
      </div>

      {/* Color picker card */}
      <div
        className="anim-color-card absolute top-10 left-2 z-20 w-[170px] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2.5"
        style={{ opacity: 0 }}
      >
        <p className="text-[8px] font-semibold text-neutral-800">Couleur du thème</p>
        <div className="flex items-center gap-2">
          {["#5851ff", "#F59E0B", "#22c55e", "#3B82F6", "#EF4444"].map((color, i) => (
            <div
              key={i}
              className="anim-color-dot w-5 h-5 rounded-full border border-neutral-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-full" />
          </div>
        </div>
        <p className="text-[5px] text-neutral-400">Personnalisez la couleur de vos documents</p>
      </div>

      {/* Cursor */}
      <svg
        className="anim-cursor absolute z-50 pointer-events-none"
        style={{ width: 20, height: 24, opacity: 0 }}
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
