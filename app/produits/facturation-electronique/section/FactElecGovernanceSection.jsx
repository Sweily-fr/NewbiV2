"use client";
import React from "react";
import InvoiceEditorAnimation from "@/app/produits/factures/section/InvoiceEditorAnimation";
import OcrScanAnimation from "./OcrScanAnimation";

export default function FactElecGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            FACTURATION ÉLECTRONIQUE
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Prêt pour la réforme 2026
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Newbi vous accompagne dans la transition vers la facturation
            électronique obligatoire. Émettez, recevez et transmettez en toute
            conformité.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Créez et envoyez vos factures simplement
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Newbi s&apos;occupe de la conformité pour vous. Créez votre facture,
                envoyez-la et suivez son statut jusqu&apos;au paiement — sans
                vous soucier des formats techniques.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden perspective-distant">
              <div className="rounded-t-2xl bg-neutral-100 border border-neutral-200 w-full h-full absolute inset-x-4 inset-y-2 p-2 overflow-hidden">
                <div className="relative w-full h-full rounded-tl-[12px] rounded-tr-[12px] ring-1 ring-black/5 overflow-hidden">
                  <img
                    src="/lp/factures/newbi-editeur-facture.png"
                    alt="Éditeur de facture Newbi"
                    className="absolute inset-0 w-full h-full object-cover object-left-top"
                  />
                  {/* Facture preview overlay */}
                  <div className="absolute bottom-3 right-20 w-[35%] z-10">
                    <img
                      src="/lp/factures/facture-preview.png"
                      alt="Aperçu facture"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Recevez vos factures d&apos;achat
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Centralisez toutes vos factures fournisseurs au format
                électronique. Scan OCR, catégorisation automatique et
                rapprochement bancaire intégrés.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
              <OcrScanAnimation />
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Facilitez votre comptabilité
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Toutes vos données de facturation sont structurées et prêtes
                à être exportées vers votre comptable. Formats FEC, CSV et
                intégration directe avec votre expert-comptable.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden perspective-distant">
              <div className="rounded-t-2xl bg-neutral-100 border border-neutral-200 w-full h-full absolute inset-x-4 inset-y-2 p-2 overflow-hidden">
                <div className="relative w-full h-full rounded-tl-[12px] rounded-tr-[12px] ring-1 ring-black/5 bg-white p-5 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <img src="/newbi-icon.svg" alt="Newbi" className="w-5 h-5" />
                      <span className="text-[11px] font-semibold text-neutral-800">Exports comptables</span>
                    </div>
                    <span className="text-[9px] text-neutral-400">3 formats disponibles</span>
                  </div>

                  {/* Export cards */}
                  <div className="flex flex-col gap-2.5 flex-1">
                    {[
                      {
                        format: "FEC",
                        desc: "Fichier des Écritures Comptables",
                        color: "#5A50FF",
                        icon: (
                          <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                            <path d="M0 3C0 1.34 1.34 0 3 0h10l9 9v14c0 1.66-1.34 3-3 3H3c-1.66 0-3-1.34-3-3V3z" fill="#EEF2FF" />
                            <path d="M13 0l9 9h-6c-1.66 0-3-1.34-3-3V0z" fill="#C7D2FE" />
                            <text x="5" y="20" fontSize="7" fontWeight="700" fill="#5A50FF" fontFamily="system-ui">FEC</text>
                          </svg>
                        ),
                      },
                      {
                        format: "CSV",
                        desc: "Tableur compatible Excel",
                        color: "#22C55E",
                        icon: (
                          <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                            <path d="M0 3C0 1.34 1.34 0 3 0h10l9 9v14c0 1.66-1.34 3-3 3H3c-1.66 0-3-1.34-3-3V3z" fill="#F0FDF4" />
                            <path d="M13 0l9 9h-6c-1.66 0-3-1.34-3-3V0z" fill="#BBF7D0" />
                            <text x="4" y="20" fontSize="7" fontWeight="700" fill="#22C55E" fontFamily="system-ui">CSV</text>
                          </svg>
                        ),
                      },
                      {
                        format: "PDF",
                        desc: "Document récapitulatif",
                        color: "#EF4444",
                        icon: (
                          <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                            <path d="M0 3C0 1.34 1.34 0 3 0h10l9 9v14c0 1.66-1.34 3-3 3H3c-1.66 0-3-1.34-3-3V3z" fill="#FEF2F2" />
                            <path d="M13 0l9 9h-6c-1.66 0-3-1.34-3-3V0z" fill="#FECACA" />
                            <text x="4" y="20" fontSize="7" fontWeight="700" fill="#EF4444" fontFamily="system-ui">PDF</text>
                          </svg>
                        ),
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-neutral-800">{item.format}</p>
                          <p className="text-[9px] text-neutral-400">{item.desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      <span className="text-[9px] text-neutral-400">Prêt pour votre expert-comptable</span>
                    </div>
                    <span className="text-[9px] font-medium text-[#5A50FF]">Exporter →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Archivage et conformité garantis
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Vos factures sont archivées de manière sécurisée pendant 10 ans
                avec horodatage qualifié. E-reporting automatique vers
                l&apos;administration fiscale, sans manipulation de votre part.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden px-4 md:px-8 pb-4">
              {/* Document rows */}
              <div className="flex flex-col gap-2.5">
                {[
                  { name: "FA-2026-0042.pdf", date: "15/03/2026", status: "Archivée", report: "Transmis" },
                  { name: "FA-2026-0041.pdf", date: "12/03/2026", status: "Archivée", report: "Transmis" },
                  { name: "FA-2026-0040.pdf", date: "08/03/2026", status: "Archivée", report: "Transmis" },
                  { name: "FA-2026-0039.pdf", date: "01/03/2026", status: "Archivée", report: "Transmis" },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-neutral-100 bg-white shadow-sm">
                    <svg width="14" height="17" viewBox="0 0 22 26" fill="none" className="shrink-0">
                      <path d="M0 3C0 1.34 1.34 0 3 0h10l9 9v14c0 1.66-1.34 3-3 3H3c-1.66 0-3-1.34-3-3V3z" fill="#FEF2F2" />
                      <path d="M13 0l9 9h-6c-1.66 0-3-1.34-3-3V0z" fill="#FECACA" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-neutral-700 truncate">{doc.name}</p>
                      <p className="text-[8px] text-neutral-400">{doc.date}</p>
                    </div>
                    <span className="text-[9px] font-medium text-[#22C55E] bg-[#22C55E]/8 px-2.5 py-1 rounded-md shrink-0">{doc.status}</span>
                    <span className="text-[9px] font-medium text-[#5A50FF] bg-[#5A50FF]/8 px-2.5 py-1 rounded-md shrink-0">{doc.report}</span>
                  </div>
                ))}
              </div>

              {/* Footer legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span className="text-[9px] text-neutral-500">Archivage 10 ans</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#5A50FF]" />
                  <span className="text-[9px] text-neutral-500">E-reporting auto</span>
                </div>
                <span className="text-[8px] text-neutral-300 ml-auto">NF Z42-013</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
