"use client";
import React from "react";
import { Eye, CircleDollarSign, Mail, Printer, Download, Trash2 } from "lucide-react";
import InvoiceEditorAnimation from "./InvoiceEditorAnimation";
import InvoiceSpeedAnimation from "./InvoiceSpeedAnimation";

export default function FacturesGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            FACTURATION SIMPLIFIÉE
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Tout ce qu'il faut pour facturer sereinement
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            De la création à l'encaissement, Newbi vous accompagne à chaque
            étape pour une facturation sans stress.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Soyez pro dès la première facture
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Même sans expérience en comptabilité, créez des factures
                conformes et professionnelles en quelques clics. Newbi vous
                guide à chaque étape.
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
                  <InvoiceEditorAnimation />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Zéro erreur sur vos documents
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Mentions légales, numérotation, calcul de TVA : tout est
                vérifié automatiquement pour que vos factures et devis soient
                toujours irréprochables.
              </p>
            </div>
            <div className="relative flex-1 min-h-[280px] sm:min-h-[200px] md:min-h-0 overflow-hidden">
              <img
                src="/lp/factures/facture-preview.png"
                alt="Facture professionnelle Newbi"
                className="absolute left-[48%] -translate-x-1/2 top-2 w-[62%] shadow-md"
              />
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Protégez votre trésorerie
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Suivez le statut de chaque facture en temps réel et relancez
                automatiquement les retards de paiement pour éviter les impayés.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden perspective-distant">
              <div className="flex-1 rounded-t-2xl flex flex-col bg-neutral-50 border border-neutral-200 mx-auto w-full h-full absolute inset-x-4 inset-y-2 pt-0 px-0 overflow-hidden">
                {/* Tableau factures */}
                <div className="flex-1 overflow-hidden relative flex flex-col gap-1.5 pt-1">
                  {/* Lignes de factures */}
                  {[
                    { amount: "1 000 €", status: "En attente dans 20 jours", statusColor: "text-orange-500 bg-orange-50 border-orange-200", date: "23/02/2026", action: "Envoyer", actionColor: "text-[#5A50FF]" },
                    { amount: "795 €", status: "En attente dans 2 jours", statusColor: "text-red-500 bg-red-50 border-red-200", date: "05/02/2026", action: "Enregistrer", actionColor: "text-[#5A50FF]" },
                    { amount: "1 250 €", status: "Payée", statusColor: "text-green-600 bg-green-50 border-green-200", date: "28/12/2025", action: "Envoyer", actionColor: "text-neutral-400" },
                    { amount: "580 €", status: "Payée", statusColor: "text-green-600 bg-green-50 border-green-200", date: "14/11/2025", action: "Envoyer", actionColor: "text-neutral-400" },
                    { amount: "1 185 €", status: "Payée", statusColor: "text-green-600 bg-green-50 border-green-200", date: "03/11/2025", action: "Envoyer", actionColor: "text-neutral-400" },
                    { amount: "990 €", status: "Payée", statusColor: "text-green-600 bg-green-50 border-green-200", date: "18/10/2025", action: "Envoyer", actionColor: "text-neutral-400" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl ring-1 ring-black/5 text-xs mx-1">
                      <span className="w-16 font-medium text-neutral-800">{row.amount}</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${row.statusColor}`}>
                        {row.status === "Payée" && <span className="mr-0.5">●</span>}
                        {row.status}
                      </span>
                      <span className="text-neutral-400 w-20 text-right">{row.date}</span>
                      <span className={`w-20 text-right font-medium ${row.actionColor}`}>{row.action}</span>
                      <span className="text-neutral-300 ml-2">⋮</span>
                    </div>
                  ))}

                  {/* Menu contextuel flottant */}
                  <div className="absolute top-[72px] right-6 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 px-1 w-[200px] z-10">
                    {[
                      { icon: <Eye className="w-4 h-4" />, label: "Aperçu" },
                      { icon: <CircleDollarSign className="w-4 h-4" />, label: "Créer un avoir", bold: true },
                      { icon: <Mail className="w-4 h-4" />, label: "Envoyer par e-mail" },
                      { icon: <Printer className="w-4 h-4" />, label: "Imprimer" },
                      { icon: <Download className="w-4 h-4" />, label: "Télécharger" },
                      { icon: <Trash2 className="w-4 h-4" />, label: "Supprimer" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer ${item.bold ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Facturez en deux fois moins de temps
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Modèles réutilisables, duplication de documents, envoi
                automatique : gagnez un temps précieux sur chaque facture.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
              <InvoiceSpeedAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
