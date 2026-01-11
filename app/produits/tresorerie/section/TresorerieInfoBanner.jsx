"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function TresorerieInfoBanner() {
  return (
    <section className="w-full bg-[#F5F5F5] py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Image */}
          <div className="flex justify-center">
            <img
              src="/undraw_key-points_iiic.svg"
              alt="Gestion de trésorerie - Points clés"
              className="w-full max-w-md h-auto"
            />
          </div>

          {/* Content */}
          <div className="space-y-6 flex flex-col items-center">
            <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-gray-950">
              Pourquoi piloter sa trésorerie est essentiel ?
            </h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-2xl">
              Une bonne gestion de trésorerie est la clé de la pérennité de
              votre entreprise. Anticipez vos besoins en cash flow, évitez les
              découverts coûteux et saisissez les opportunités de croissance au
              bon moment. Avec newbi, gardez le contrôle de vos finances.
            </p>
            <div className="pt-2">
              <Link href="/ressources/gestion-tresorerie">
                <Button
                  size="lg"
                  className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white rounded-lg px-6 gap-2"
                >
                  Guide complet de la gestion de trésorerie
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
