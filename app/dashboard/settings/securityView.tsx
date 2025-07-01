"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import { PlusCircle, Smartphone, Shield } from "lucide-react";
import { Separator } from "@/src/components/ui/separator";

export default function SecurityView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Colonne de gauche */}
      <div className="space-y-6 md:col-span-2">
        {/* Détails du compte */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du compte</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6">
            {/* Vérifier l'adresse email */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Vérifier l'adresse email</h3>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez votre adresse email pour confirmer vos identifiants
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-600 border-green-200"
                >
                  Vérifié
                </Badge>
              </div>
            </div>

            {/* Mettre à jour le mot de passe */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mettre à jour le mot de passe</h3>
                  <p className="text-sm text-muted-foreground pr-4">
                    Changez votre mot de passe pour mettre à jour et protéger
                    votre compte
                  </p>
                </div>
                <Button variant="outline">Changer le mot de passe</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres de récupération */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de récupération</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6">
            {/* Email de récupération */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email de récupération</h3>
                  <p className="text-sm text-muted-foreground">
                    Configurez un email de récupération pour sécuriser votre
                    compte
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="info@exemple.com"
                  className="flex-1"
                  defaultValue="info@pagedone.com"
                />
                <Button>Enregistrer</Button>
              </div>
            </div>

            {/* Numéro de téléphone de récupération */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    Numéro de téléphone de récupération
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez un numéro de téléphone pour configurer la
                    récupération par SMS
                  </p>
                </div>
                <Button variant="outline">Configurer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonne de droite */}
      <div className="space-y-6">
        {/* Désactiver le compte */}
        <Card>
          <CardHeader>
            <CardTitle>Désactiver le compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Cela fermera votre compte. Il sera réactivé lors de votre
                prochaine connexion.
              </p>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
              >
                Désactiver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
