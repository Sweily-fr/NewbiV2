/**
 * Sélecteur d'orientation de signature (horizontale/verticale)
 * Affiché avant la création d'une nouvelle signature
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowRight, Columns2, Rows2 } from "lucide-react";

const OrientationSelector = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-4xl space-y-8">
        {/* En-tête */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Créer une signature mail
          </h1>
          <p className="text-lg text-muted-foreground">
            Choisissez l'orientation de votre signature
          </p>
        </div>

        {/* Cartes de sélection */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Signature Horizontale */}
          <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50"
            onClick={() => onSelect("horizontal")}
          >
            <CardContent className="p-8 space-y-6">
              {/* Icône */}
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Columns2 className="w-12 h-12 text-primary" />
                </div>
              </div>

              {/* Titre */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Horizontale</h3>
                <p className="text-sm text-muted-foreground">
                  Photo et infos à gauche, contact à droite
                </p>
              </div>

              {/* Aperçu visuel */}
              <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-muted-foreground/20">
                <div className="flex items-start gap-4">
                  {/* Colonne gauche */}
                  <div className="flex-shrink-0 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/20" />
                    <div className="space-y-1">
                      <div className="h-2 w-20 bg-foreground/20 rounded" />
                      <div className="h-2 w-16 bg-foreground/10 rounded" />
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="w-px h-16 bg-border" />

                  {/* Colonne droite */}
                  <div className="flex-1 space-y-1.5">
                    <div className="h-1.5 w-full bg-foreground/10 rounded" />
                    <div className="h-1.5 w-4/5 bg-foreground/10 rounded" />
                    <div className="h-1.5 w-3/4 bg-foreground/10 rounded" />
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <Button
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                variant="outline"
              >
                Choisir
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Signature Verticale */}
          <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50"
            onClick={() => onSelect("vertical")}
          >
            <CardContent className="p-8 space-y-6">
              {/* Icône */}
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Rows2 className="w-12 h-12 text-primary" />
                </div>
              </div>

              {/* Titre */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Verticale</h3>
                <p className="text-sm text-muted-foreground">
                  Photo en haut, infos centrées en dessous
                </p>
              </div>

              {/* Aperçu visuel */}
              <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-muted-foreground/20">
                <div className="flex flex-col items-center gap-3">
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-full bg-primary/20" />

                  {/* Infos personnelles */}
                  <div className="space-y-1 w-full">
                    <div className="h-2 w-24 bg-foreground/20 rounded mx-auto" />
                    <div className="h-2 w-20 bg-foreground/10 rounded mx-auto" />
                  </div>

                  {/* Séparateur */}
                  <div className="w-20 h-px bg-border" />

                  {/* Contact */}
                  <div className="space-y-1 w-full">
                    <div className="h-1.5 w-28 bg-foreground/10 rounded mx-auto" />
                    <div className="h-1.5 w-24 bg-foreground/10 rounded mx-auto" />
                  </div>

                  {/* Réseaux sociaux */}
                  <div className="flex gap-2 mt-2">
                    <div className="w-4 h-4 rounded-full bg-foreground/10" />
                    <div className="w-4 h-4 rounded-full bg-foreground/10" />
                    <div className="w-4 h-4 rounded-full bg-foreground/10" />
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <Button
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                variant="outline"
              >
                Choisir
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground">
          Vous pourrez personnaliser tous les détails après avoir choisi l'orientation
        </p>
      </div>
    </div>
  );
};

export default OrientationSelector;
