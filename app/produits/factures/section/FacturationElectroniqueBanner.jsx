"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FacturationElectroniqueBanner() {
  return (
    <section className="w-full bg-[#F5F5F5] mt-20 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Image */}
          <div className="flex justify-center">
            <img
              src="/undraw_key-points_iiic.svg"
              alt="Facturation électronique - Points clés"
              className="w-[100px] h-auto"
            />
          </div>

          {/* Content */}
          <div className="space-y-6 flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50 mb-4">
              Prêt pour la facturation électronique ?
            </h2>
            <p className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
              N'attendez pas 2026 pour vous préparer à la réforme. Avec newbi,
              vous créez et envoyez des factures conformes aux nouvelles
              obligations légales dès aujourd'hui.
            </p>
            <div className="pt-2">
              <Link href="/ressources/facturation-electronique">
                <Button
                  size="lg"
                  className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal"
                >
                  Tout savoir sur la facture électronique
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
