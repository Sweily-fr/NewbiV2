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
      monthly: "17,99€",
      annual: "16,19€",
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
      pme: "Jusqu'à 10 utilisateurs",
      entreprise: "Jusqu'à 25 utilisateurs",
      type: "text",
    },
    {
      name: "Création d'organisation",
      description: "Créez et gérez votre organisation",
      freelance: "Illimité",
      pme: "Illimité",
      entreprise: "Illimité",
      type: "text",
    },
    {
      name: "Utilisateur comptable gratuit",
      description: "Ajoutez un comptable sans frais supplémentaires",
      freelance: "1 comptable",
      pme: "3 comptables",
      entreprise: "5 comptables",
      type: "text",
    },
    {
      name: "Utilisateurs supplémentaires",
      description: "Au-delà de votre limite d'utilisateurs",
      freelance: "-",
      pme: "7,49€ TTC/utilisateur supplémentaire",
      entreprise: "7,49€ TTC/utilisateur supplémentaire",
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
      name: "Relance automatique impayés",
      description: "Automatisez vos relances de factures impayées",
      freelance: "-",
      pme: true,
      entreprise: true,
      type: "mixed",
    },
    {
      name: "OCR des reçus",
      description: "Numérisez automatiquement vos dépenses",
      freelance: "20 reçus par mois",
      pme: true,
      entreprise: true,
      type: "mixed",
    },
    {
      name: "Connexion bancaire (à venir)",
      description: "Synchronisez vos comptes bancaires",
      freelance: "Synchroniser un compte bancaire",
      pme: "Synchroniser jusqu'à 3 comptes bancaires",
      entreprise: "Synchroniser jusqu'à 5 comptes bancaires",
      type: "text",
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
      name: "Gestion des projets",
      description: "Organisez vos projets avec des tableaux Kanban",
      freelance: true,
      pme: true,
      entreprise: true,
      type: "check",
    },
    {
      name: "Signature de mail",
      description: "Créez des signatures de mail professionnelles",
      freelance: "Une signature",
      pme: "Jusqu'à 10 signatures",
      entreprise: "Jusqu'à 25 signatures",
      type: "text",
    },
    {
      name: "Transfert de fichier",
      description: "Partagez vos fichiers en toute sécurité",
      freelance: "Envoyé jusqu'à 5Go",
      pme: "Envoyé jusqu'à 15Go",
      entreprise: "Envoyé jusqu'à 15Go",
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
      freelance: "-",
      pme: true,
      entreprise: true,
      type: "mixed",
    },
    {
      name: "API access (à venir)",
      description: "Accédez à notre API pour vos intégrations",
      freelance: "-",
      pme: true,
      entreprise: true,
      type: "mixed",
    },
  ];

  // Features principales à afficher dans les cartes mobiles
  const mainFeatures = [
    "Facturation & Devis",
    "OCR des reçus",
    "Connexion bancaire",
    "Gestion de trésorerie",
    "CRM client",
  ];

  return (
    <div id="pricing" className="w-full pt-20 lg:pt-20 pb-20 overflow-visible">
      <div className="container mx-auto overflow-visible">
        <div className="flex text-center justify-center items-center gap-2 flex-col">
          {/* <Badge>Pricing</Badge> */}
          {/* <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3"></span> */}
          <div className="flex flex-col">
            <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50 mb-4">
              Profitez de 30 jours offerts
            </h2>
            <p className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-2xl">
              Sans engagement et résiliable à tout moment !
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

          {/* VERSION MOBILE - Cartes empilées */}
          <div className="w-full pt-10 lg:hidden flex flex-col gap-6 px-4">
            {/* Carte Freelance */}
            <div className="border rounded-lg p-6 bg-background shadow-sm">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">Freelance</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Parfait pour les indépendants et freelances qui démarrent
                    leur activité
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {isAnnual
                      ? pricing.freelance.annual
                      : pricing.freelance.monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    TTC / mois
                  </span>
                </div>

                {isAnnual && (
                  <p className="text-xs text-muted-foreground">
                    {pricing.freelance.annualTotal} facturé annuellement
                  </p>
                )}

                <div className="flex flex-col gap-2 py-4 border-t border-b">
                  <p className="text-sm font-medium text-muted-foreground">
                    1 utilisateur
                  </p>
                  {mainFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" className="gap-4 w-full">
                  <Link href="/auth/signup">
                    Essayer 30 jours gratuits <MoveRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Carte TPE */}
            <div className="border-2 border-primary rounded-lg p-6 bg-background shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Populaire
                </Badge>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">TPE</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Idéal pour les petites et moyennes entreprises en croissance
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {isAnnual ? pricing.pme.annual : pricing.pme.monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    TTC / mois
                  </span>
                </div>

                {isAnnual && (
                  <p className="text-xs text-muted-foreground">
                    {pricing.pme.annualTotal} facturé annuellement
                  </p>
                )}

                <div className="flex flex-col gap-2 py-4 border-t border-b">
                  <p className="text-sm font-medium text-muted-foreground">
                    10 utilisateurs
                  </p>
                  {mainFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button asChild className="gap-4 w-full">
                  <Link href="/auth/signup">
                    Essayer 30 jours gratuits <MoveRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Carte Entreprise */}
            <div className="border rounded-lg p-6 bg-background shadow-sm">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">Entreprise</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Pour les grandes structures avec des besoins avancés
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {isAnnual
                      ? pricing.entreprise.annual
                      : pricing.entreprise.monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    TTC / mois
                  </span>
                </div>

                {isAnnual && (
                  <p className="text-xs text-muted-foreground">
                    {pricing.entreprise.annualTotal} facturé annuellement
                  </p>
                )}

                <div className="flex flex-col gap-2 py-4 border-t border-b">
                  <p className="text-sm font-medium text-muted-foreground">
                    25 utilisateurs
                  </p>
                  {mainFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" className="gap-4 w-full">
                  <Link href="/auth/signup">
                    Essayer 30 jours gratuits <MoveRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* VERSION DESKTOP - Tableau avec sticky header */}
          <div className="w-full hidden lg:block">
            {/* Masque invisible pour cacher le contenu qui scroll */}
            <div className="sticky top-0 h-20 z-10 bg-[#FDFDFD] dark:bg-background"></div>

            {/* Header sticky */}
            <div className="sticky top-20 z-10 bg-[#FDFDFD] dark:bg-background">
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
                      Essayer 30 jours gratuits{" "}
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
                      Essayer 30 jours gratuits{" "}
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
                      Essayer 30 jours gratuits{" "}
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
                <span className="font-medium">Fonctionnalités</span>
              </div>
              <div className="bg-muted/50"></div>
              <div className="bg-muted/50"></div>
              <div className="bg-muted/50"></div>

              {/* Boucle sur les fonctionnalités */}
              {features.map((feature, index) => {
                // Fonction pour afficher la valeur selon le type
                const renderValue = (value) => {
                  if (value === true) {
                    return <Check className="w-4 h-4 text-primary" />;
                  }
                  return (
                    <p className="text-muted-foreground text-sm text-center">
                      {value}
                    </p>
                  );
                };

                return (
                  <React.Fragment key={index}>
                    <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4">
                      <p className="text-sm font-normal">{feature.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center items-center">
                      {renderValue(feature.freelance)}
                    </div>
                    <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center items-center">
                      {renderValue(feature.pme)}
                    </div>
                    <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center items-center">
                      {renderValue(feature.entreprise)}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
