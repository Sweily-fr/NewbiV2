"use client";

import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("yearly");
  return (
    <section className="py-8 md:py-16 px-4 md:px-0" id="pricing">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-xl md:text-2xl lg:text-4xl font-medium text-gray-900 mb-3 md:mb-4">
          Prix adaptés à tous
        </h2>
        <p className="text-sm md:text-md text-gray-600 max-w-2xl mx-auto mb-4 md:mb-6 px-4 md:px-0">
          Inscrivez-vous gratuitement à Newbi avant de prendre un plan payant.
          <span className="text-[#5B4FFF]"> 14 jours d'essais offerts</span> et
          possibilité de résilier à tout moment sans condition.
        </p>

        <div className="flex justify-center px-4 md:px-0">
          <Tabs
            defaultValue="monthly"
            value={billingCycle}
            onValueChange={setBillingCycle}
            className="w-full max-w-xs mx-auto"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 md:h-auto">
              <TabsTrigger value="monthly" className="text-sm md:text-base">Mensuel</TabsTrigger>
              <TabsTrigger value="yearly" className="relative text-sm md:text-base">
                Annuel
                <span className="absolute -top-1 md:-top-2 -right-1 md:-right-2 bg-[#5B4FFF] text-white text-[8px] md:text-[10px] font-medium px-1 md:px-1.5 py-0.5 rounded-sm">
                  -10%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 md:gap-0 bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-200 mx-4 md:mx-auto">
        {/* Left: Offer */}
        <div className="flex-1 pr-0 md:pr-8">
          <h3 className="text-xl md:text-2xl font-medium text-gray-900 mb-3 md:mb-4">Premium</h3>
          <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6">
            Inscrivez-vous gratuitement à Newbi avant de prendre un plan payant.
            <span className="text-[#5B4FFF]">
              {" "}
              14 jours d'essais offerts
            </span>{" "}
            et possibilité de résilier à tout moment sans condition.
          </p>
          <div>
            <h4 className="font-medium text-[#5B4FFF] mb-3 md:mb-4 text-sm md:text-base">
              Ce qui est inclus
            </h4>
            <ul className="text-gray-700 space-y-2">
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">Accès à tous les outils</span>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">1 collaborateur gratuit</span>
              </li>
              <li className="flex items-center">
                <CheckIcon />
                <span className="text-sm">Support client prioritaire</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Price box */}
        <div className="flex-1 mt-4 md:mt-0 md:ml-8 flex flex-col items-center justify-center bg-gray-50 border rounded-2xl border-gray-200 p-4 md:p-8">
          <div className="text-center w-full">
            <p className="font-medium text-gray-700 mb-2 text-sm md:text-base">
              {billingCycle === "monthly"
                ? "Abonnement mensuel"
                : "Abonnement annuel"}
              {billingCycle === "yearly" && (
                <span className="ml-2 text-sm text-[#5B4FFF]">-10%</span>
              )}
            </p>
            <div className="flex flex-col items-center justify-center mb-3 md:mb-4">
              {billingCycle === "monthly" ? (
                <>
                  <div className="flex items-baseline justify-center gap-2 md:gap-3">
                    <span className="text-base md:text-xl line-through text-red-400">
                      14,99€
                    </span>
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline">
                        <span className="text-[#5B4FFF] text-3xl md:text-5xl font-medium">12,49€</span>
                        <span className="text-sm md:text-base text-[#5B4FFF] ml-1">/mois</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-1">La première année</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-center gap-2 md:gap-3">
                    <span className="text-base md:text-xl line-through text-red-400">
                      13,49€
                    </span>
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline">
                        <span className="text-[#5B4FFF] text-3xl md:text-5xl font-medium">11,24€</span>
                        <span className="text-sm md:text-base text-[#5B4FFF] ml-1">/mois</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-1">La première année</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            {billingCycle === "yearly" && (
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                <span className="relative mr-1 line-through text-gray-500">
                  161,88€
                </span>
                <span className="text-[#5B4FFF] font-medium">134,88€</span> facturé annuellement
              </p>
            )}
            <a
              href="/auth/signup"
              className="block w-full bg-[#171717] text-white font-medium rounded-md px-4 md:px-6 py-3 mt-2 mb-3 transition text-sm md:text-base"
            >
              Commence GRATUITEMENT !
            </a>
            <p className="text-xs text-gray-400 mt-1">
              Résiliation facile et sans condition à tout moment.
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
