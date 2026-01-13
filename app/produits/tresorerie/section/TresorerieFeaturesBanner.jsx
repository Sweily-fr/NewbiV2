"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Upload, Clock, Target, Shield } from "lucide-react";

export default function TresorerieFeaturesBanner() {
  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Import simplifié",
      description: "Importez vos données bancaires en quelques clics",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Gagnez 1 jour par mois",
      description: "Automatisez la collecte et le rapprochement bancaire",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Toutes vos finances sur 1 outil",
      description: "Comptabilité, achats, ventes, trésorerie",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sans engagement",
      description: "Découvrez newbi avec un abonnement mensuel flexible",
    },
  ];

  return (
    <section className="w-full bg-[#F5F5F5] mt-20 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50 mb-4">
            Pourquoi choisir newbi pour votre gestion de trésorerie ?
          </h2>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl mt-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-14 h-14 rounded-lg bg-[#5a54fa]/10 flex items-center justify-center text-[#5a54fa]">
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-950">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-6">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal"
              >
                Démarrer maintenant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
