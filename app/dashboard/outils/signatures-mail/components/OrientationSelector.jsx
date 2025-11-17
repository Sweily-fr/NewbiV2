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
    <div className="h-[calc(100vh-64px)] flex items-center justify-center p-3 bg-gradient-to-br from-background to-muted/20 overflow-hidden">
      <div className="w-full max-w-5xl space-y-8 px-4">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-foreground">
            Choisissez l'orientation de votre signature
          </p>
        </div>

        {/* Cartes de sélection */}
        <div className="grid md:grid-cols-2 gap-5 items-stretch">
          {/* Signature Horizontale */}
          <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 h-full"
            onClick={() => onSelect("horizontal")}
          >
            <CardContent className="p-5 space-y-3 flex flex-col h-full">
              {/* Icône */}
              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Columns2 className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Titre */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold">Horizontale</h3>
                <p className="text-xs text-muted-foreground">
                  Photo et infos à gauche, contact à droite
                </p>
              </div>

              {/* Aperçu visuel */}
              <div className="bg-muted/30 rounded-lg p-4 border-2 border-dashed border-muted-foreground/20 h-[180px] flex items-center flex-1 overflow-hidden">
                <div className="flex items-center gap-6 w-full">
                  {/* Colonne gauche */}
                  <div className="flex-shrink-0 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-primary/20" />
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-foreground/20 rounded" />
                      <div className="h-3 w-20 bg-foreground/10 rounded" />
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="w-px h-40 bg-border" />

                  {/* Colonne droite */}
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-full bg-foreground/20 rounded" />
                    <div className="h-2 w-4/5 bg-foreground/10 rounded" />
                    <div className="h-2 w-3/4 bg-foreground/10 rounded" />
                    <div className="h-2 w-3/5 bg-foreground/10 rounded" />
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <Button
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground mt-2"
                variant="outline"
              >
                Choisir
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Signature Verticale */}
          <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 h-full"
            onClick={() => onSelect("vertical")}
          >
            <CardContent className="p-5 space-y-3 flex flex-col h-full">
              {/* Icône */}
              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Rows2 className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Titre */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold">Verticale</h3>
                <p className="text-xs text-muted-foreground">
                  Photo en haut, infos centrées en dessous
                </p>
              </div>

              {/* Aperçu visuel */}
              <div className="bg-muted/30 rounded-lg p-4 border-2 border-dashed border-muted-foreground/20 h-[180px] flex items-center flex-1 overflow-hidden">
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Photo */}
                  <div className="w-20 h-20 rounded-full bg-primary/20" />

                  {/* Infos personnelles */}
                  <div className="space-y-2 w-full">
                    <div className="h-3 w-28 bg-foreground/20 rounded mx-auto" />
                    <div className="h-3 w-24 bg-foreground/10 rounded mx-auto" />
                  </div>

                  {/* Séparateur */}
                  <div className="w-24 h-px bg-border" />

                  {/* Contact */}
                  <div className="space-y-2 w-full">
                    <div className="h-2 w-32 bg-foreground/10 rounded mx-auto" />
                    <div className="h-2 w-28 bg-foreground/10 rounded mx-auto" />
                  </div>

                  {/* Réseaux sociaux */}
                  <div className="flex gap-3 mt-2">
                    <div className="w-5 h-5 rounded-full bg-foreground/10" />
                    <div className="w-5 h-5 rounded-full bg-foreground/10" />
                    <div className="w-5 h-5 rounded-full bg-foreground/10" />
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <Button
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground mt-2"
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
