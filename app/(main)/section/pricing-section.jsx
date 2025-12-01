"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Prix mensuels et annuels
  const pricing = {
    freelance: {
      monthly: "14,59€",
      annual: "13,13€",
      annualTotal: "157,56€",
    },
    pme: {
      monthly: "48,99€",
      annual: "44,09€",
      annualTotal: "529,08€",
    },
    entreprise: {
      monthly: "94,99€",
      annual: "85,49€",
      annualTotal: "1 025,88€",
    },
  };

  // Fonctionnalités à afficher dans le tableau
  const features = [
    {
      name: "Utilisateurs",
      description: "Nombre d'utilisateurs inclus",
      freelance: "1 utilisateur",
      pme: "10 utilisateurs",
      entreprise: "25 utilisateurs",
      type: "text",
    },
    {
      name: "Création d'organisation",
      description: "Créez et gérez votre organisation",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Utilisateur comptable gratuit",
      description: "Ajoutez un comptable sans frais supplémentaires",
      freelance: "1",
      pme: "1",
      entreprise: "1",
      type: "text",
    },
    {
      name: "Utilisateurs supplémentaires",
      description: "Au-delà de votre limite d'utilisateurs",
      freelance: "7,49€ TTC",
      pme: "7,49€ TTC",
      entreprise: "7,49€ TTC",
      type: "text",
    },
    {
      name: "Facturation & Devis",
      description: "Créez et gérez vos factures et devis",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "OCR des reçus",
      description: "Numérisez automatiquement vos reçus",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Connexion bancaire",
      description: "Synchronisez vos comptes bancaires",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Gestion de trésorerie",
      description: "Suivez votre trésorerie en temps réel",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Gestion de projets",
      description: "Organisez vos projets avec des tableaux Kanban",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Signature de mail",
      description: "Créez des signatures professionnelles",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Transfert de fichier",
      description: "Partagez vos fichiers en toute sécurité",
      freelance: "5 Go",
      pme: "5 Go",
      entreprise: "5 Go",
      type: "text",
    },
    {
      name: "CRM client",
      description: "Gérez vos relations clients efficacement",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Catalogue",
      description: "Créez votre catalogue de produits",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Support prioritaire",
      description: "Assistance prioritaire par email",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "API Access",
      description: "Accédez à notre API pour vos intégrations",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
  ];

  return (
    <div id="pricing" className="w-full py-20 lg:py-40 overflow-visible">
      <div className="container mx-auto overflow-visible">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          {/* <Badge>Pricing</Badge> */}
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-center font-regular">
              Prix adaptés à tous
            </h2>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
              Choisissez le plan qui correspond à votre activité
            </p>
          </div>

          {/* Switch Mensuel/Annuel */}
          <div className="inline-flex items-center gap-3 bg-muted p-1 rounded-lg mt-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                !isAnnual
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                isAnnual
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="ml-2 text-xs text-[#5b50fe]">-10%</span>
            </button>
          </div>
          <div className="w-full pt-10">
            {/* Masque invisible pour cacher le contenu qui scroll */}
            <div className="sticky top-0 h-20 z-50 bg-[#FDFDFD] dark:bg-background"></div>

            {/* Header sticky */}
            <div className="sticky top-20 z-50 bg-[#FDFDFD] dark:bg-background">
              <div className="grid text-left w-full grid-cols-3 lg:grid-cols-4 divide-x border-b">
                <div className="col-span-3 lg:col-span-1"></div>
                <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col">
                  <p className="text-2xl">Freelance</p>
                  <p className="text-sm text-muted-foreground">
                    Parfait pour les indépendants et freelances qui démarrent
                    leur activité
                  </p>
                  <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                    <span className="text-4xl">
                      {isAnnual
                        ? pricing.freelance.annual
                        : pricing.freelance.monthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      TTC / mois
                    </span>
                  </p>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground">
                      {pricing.freelance.annualTotal} facturé annuellement
                    </p>
                  )}
                  <Button asChild variant="outline" className="gap-4 mt-8">
                    <Link href="/auth/signup">
                      Essayer 14 jours gratuits{" "}
                      <MoveRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col">
                  <p className="text-2xl">TPE</p>
                  <p className="text-sm text-muted-foreground">
                    Idéal pour les petites et moyennes entreprises en croissance
                  </p>
                  <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                    <span className="text-4xl">
                      {isAnnual ? pricing.pme.annual : pricing.pme.monthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      TTC / mois
                    </span>
                  </p>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground">
                      {pricing.pme.annualTotal} facturé annuellement
                    </p>
                  )}
                  <Button asChild className="gap-4 mt-8">
                    <Link href="/auth/signup">
                      Essayer 14 jours gratuits{" "}
                      <MoveRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col">
                  <p className="text-2xl">Entreprise</p>
                  <p className="text-sm text-muted-foreground">
                    Pour les grandes structures avec des besoins avancés
                  </p>
                  <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                    <span className="text-4xl">
                      {isAnnual
                        ? pricing.entreprise.annual
                        : pricing.entreprise.monthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      TTC / mois
                    </span>
                  </p>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground">
                      {pricing.entreprise.annualTotal} facturé annuellement
                    </p>
                  )}
                  <Button asChild variant="outline" className="gap-4 mt-8">
                    <Link href="/auth/signup">
                      Essayer 14 jours gratuits{" "}
                      <MoveRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Contenu qui scroll - Tableau des fonctionnalités */}
            <div className="grid text-left w-full grid-cols-3 lg:grid-cols-4 divide-x">
              {/* Ligne Fonctionnalités */}
              <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 text-sm py-4 bg-muted/50">
                <span className="font-semibold">Fonctionnalités</span>
              </div>
              <div className="bg-muted/50"></div>
              <div className="bg-muted/50"></div>
              <div className="bg-muted/50"></div>

              {/* Boucle sur les fonctionnalités */}
              {features.map((feature, index) => (
                <React.Fragment key={index}>
                  <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                  <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                    {feature.type === "check" ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {feature.freelance}
                      </p>
                    )}
                  </div>
                  <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                    {feature.type === "check" ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {feature.pme}
                      </p>
                    )}
                  </div>
                  <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center">
                    {feature.type === "check" ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {feature.entreprise}
                      </p>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
