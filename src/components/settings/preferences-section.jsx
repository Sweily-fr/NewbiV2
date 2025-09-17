"use client";

import React from "react";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { ChevronDown } from "lucide-react";
import DarkModeComponent from "@/src/components/darkmode";
import { Separator } from "@/src/components/ui/separator";

export function PreferencesSection() {
  return (
    <div className="space-y-8">
      {/* Confidentialité */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">Préférences</h2>
        <Separator />
        {/* Dark Mode Component */}
        <div className="mb-8 mt-12">
          <DarkModeComponent />
        </div>

        <Separator />

        {/* Paramètres des cookies */}
        <div className="space-y-10 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Paramètres des cookies
              </h3>
              <p className="text-xs text-gray-600">
                Personnalisez les cookies. Pour en savoir plus, consultez notre{" "}
                <button className="text-gray-600 underline hover:text-gray-800">
                  Politique en matière de cookies.
                </button>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 flex items-center gap-2"
            >
              Personnaliser
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Afficher l'historique de mes vues */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Afficher l'historique de mes vues
              </h3>
              <p className="text-xs text-gray-600">
                Les personnes disposant d'un accès complet ou d'un accès en
                écriture pourront voir quand vous avez consulté une page.{" "}
                <button className="text-gray-600 underline hover:text-gray-800">
                  En savoir plus.
                </button>
              </p>
            </div>
            <Switch
              defaultChecked={true}
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>

          {/* Visibilité du profil */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Visibilité du profil
              </h3>
              <p className="text-xs text-gray-600">
                Les utilisateurs qui utilisent votre adresse e-mail pour vous
                inviter à un nouvel espace de travail pourront voir votre nom et
                votre photo de profil.{" "}
                <button className="text-gray-600 underline hover:text-gray-800">
                  En savoir plus..
                </button>
              </p>
            </div>
            <Switch
              defaultChecked={true}
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreferencesSection;
