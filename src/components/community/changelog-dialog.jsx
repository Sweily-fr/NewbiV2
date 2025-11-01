"use client";

import { X, Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "../ui/dialog";
import { Changelog1 } from "../ui/changelog-1";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// VisuallyHidden component pour l'accessibilité
const VisuallyHidden = ({ children }) => (
  <span className="sr-only">{children}</span>
);

export function ChangelogDialog({ open, onOpenChange }) {
  const entries = [
    {
      version: "Version 2.0.0",
      date: "24 Octobre 2025",
      title: "Système de Communauté",
      description:
        "Lancement du système de communauté permettant aux utilisateurs de proposer des idées, signaler des bugs et valider les fonctionnalités.",
      items: [
        "Nouveau système de communauté avec idées et bugs",
        "Validation automatique des suggestions à 5 validations",
        "Système de votes positifs/négatifs",
        "Publication anonyme par défaut",
        'Onglet "Validé" pour les suggestions approuvées',
      ],
    },
    {
      version: "Version 1.9.0",
      date: "15 Octobre 2025",
      title: "Amélioration du Cache Dashboard",
      description:
        "Optimisation complète du système de cache pour le dashboard et les composants bancaires.",
      items: [
        "Amélioration du cache intelligent du dashboard",
        "Optimisation des performances bancaires",
        "Nouvelle interface de gestion des dépenses",
        "Réduction de 66% des appels API",
        "Affichage instantané des données en cache",
      ],
    },
    {
      version: "Version 1.8.0",
      date: "1 Octobre 2025",
      title: "Système de Parrainage",
      description:
        "Implémentation complète du système de parrainage avec bonus financier.",
      items: [
        "Système de parrainage avec bonus 50€",
        "Intégration Stripe Connect",
        "Webhooks de paiement automatiques",
        "Génération de liens de parrainage",
        "Email de remerciement au parrain",
      ],
    },
    {
      version: "Version 1.7.0",
      date: "15 Septembre 2025",
      title: "Migration Architecture MongoDB",
      description:
        "Migration réussie vers la nouvelle architecture MongoDB avec amélioration de la sécurité.",
      items: [
        "Migration vers nouvelle architecture MongoDB",
        "Amélioration de la sécurité d'authentification",
        "Optimisation des requêtes GraphQL",
        "Système de cache unifié",
        "Validation d'intégrité des données",
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="bg-background fixed inset-0 z-50 w-full h-full md:w-[calc(100%-4rem)] md:h-[calc(100%-4rem)] md:rounded-lg border shadow-lg md:-translate-x-1/2 md:-translate-y-1/2 md:top-1/2 md:left-1/2">
          <DialogTitle>
            <VisuallyHidden>Changelog</VisuallyHidden>
          </DialogTitle>

          <DialogPrimitive.Close className="absolute top-2 right-2 w-5 h-5 md:top-2 md:right-2 md:w-14 md:h-14 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            <X className="w-5 h-5 md:w-5 md:h-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 pb-3 md:pb-4 border-b">
              <h2 className="text-xl font-medium mb-2">Changelog Newbi</h2>
              <p className="text-muted-foreground text-sm">
                Découvrez les dernières mises à jour et améliorations de la
                plateforme.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-6 md:pt-24">
              <div className="mx-auto max-w-3xl space-y-16 md:space-y-24">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col gap-4 md:flex-row md:gap-16"
                  >
                    <div className="top-8 flex h-min w-64 shrink-0 items-center gap-4 md:sticky">
                      <span className="text-sm font-medium text-primary">
                        {entry.version}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {entry.date}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {entry.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {entry.description}
                      </p>
                      {entry.items && entry.items.length > 0 && (
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {entry.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}

                {/* Illustration de sortie */}
                <div className="relative flex flex-col items-center justify-center pt-16 pb-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 rounded-full bg-[#5b4eff]/10 dark:bg-[#5b4eff]/20"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#5b4eff] text-white">
                      <Rocket className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground/90">
                    Sortie de Newbi
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Merci de faire partie de l'aventure Newbi. Restez à l'écoute
                    pour les prochaines mises à jour !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
