"use client";

import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  return (
    <section className="py-16" id="pricing">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-4xl font-medium text-gray-900 mb-4">
          Prix adaptés à tous
        </h2>
        <p className="text-md text-gray-600 max-w-2xl mx-auto mb-6">
          Inscrivez-vous gratuitement à Newbi avant de prendre un plan payant.
          <span className="text-[#5B4FFF]">14 jours d'essais offerts</span> et
          possibilité de résilier à tout moment sans condition.
        </p>

        <div className="flex justify-center">
          <Tabs
            defaultValue="monthly"
            value={billingCycle}
            onValueChange={setBillingCycle}
            className="w-full max-w-xs mx-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Mensuel</TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                Annuel
                <span className="absolute -top-2 -right-2 bg-[#5B4FFF] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-sm">
                  -10%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-0 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        {/* Left: Offer */}
        <div className="flex-1 pr-0 md:pr-8">
          <h3 className="text-2xl font-medium text-gray-900 mb-4">Premium</h3>
          <p className="text-gray-500 mb-6">
            Inscrivez-vous gratuitement à Newbi avant de prendre un plan payant.
            <span className="text-[#5B4FFF]">14 jours d'essais offerts</span> et
            possibilité de résilier à tout moment sans condition.
          </p>
          <div>
            <h4 className="font-medium text-[#5B4FFF] mb-4">
              Ce qui est inclus
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">Accès à tous les outils</span>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">Facturation et devis illimités</span>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">Signatures email personnalisées</span>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">Support client prioritaire</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Price box */}
        <div className="flex-1 mt-8 md:mt-0 md:ml-8 flex flex-col items-center justify-center bg-gray-50 border rounded-2xl border-gray-200 p-8">
          <div className="text-center">
            <p className="font-medium text-gray-700 mb-2">
              {billingCycle === "monthly"
                ? "Abonnement mensuel"
                : "Abonnement annuel"}
              {billingCycle === "yearly" && (
                <span className="ml-2 text-sm text-[#5B4FFF]">-10%</span>
              )}
            </p>
            <p className="flex items-baseline justify-center text-5xl font-medium text-gray-900 mb-4">
              {billingCycle === "monthly" ? (
                <>
                  14,99{" "}
                  <span className="text-base font-medium text-gray-500 ml-2">
                    EUR/mois
                  </span>
                </>
              ) : (
                <>
                  161,89{" "}
                  <span className="text-base font-medium text-gray-500 ml-2">
                    EUR/an
                  </span>
                </>
              )}
            </p>
            <a
              href="#"
              className="block w-full bg-[#171717] text-white font-medium rounded-md px-6 py-3 mt-2 mb-3 transition"
            >
              Commencer
            </a>
            <p className="text-xs text-gray-400 mt-1">
              Les factures et les reçus sont disponibles pour une utilisation
              simple
              <br />
              pour les remboursements
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Check icon SVG for list items.
function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-[#5B4FFF] mr-2 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
