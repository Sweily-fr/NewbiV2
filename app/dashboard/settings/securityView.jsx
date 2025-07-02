"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import { PlusCircle, Smartphone, Shield, Github, Mail } from "lucide-react";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { useState } from "react";

export default function SecurityView({ session }) {
  const emailVerified = session?.user?.emailVerified;
  console.log(emailVerified, "emailVerified");
  const [isOpen, setIsOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);

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
                  className={
                    emailVerified
                      ? "bg-green-50 text-green-600 border-green-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }
                >
                  {emailVerified ? "Vérifié" : "Non vérifié"}
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
                <Dialog
                  open={isPhoneDialogOpen}
                  onOpenChange={setIsPhoneDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">Configurer</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        Numéro de téléphone de récupération
                      </DialogTitle>
                      <DialogDescription>
                        Ajoutez un numéro de téléphone pour renforcer la
                        sécurité de votre compte et faciliter la récupération.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                          Numéro de téléphone
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="phone"
                            placeholder="+33 6 12 34 56 78"
                            type="tel"
                          />
                          <Button>Vérifier</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Un code de vérification sera envoyé à ce numéro.
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label htmlFor="code" className="text-sm font-medium">
                          Code de vérification
                        </label>
                        <div className="flex gap-2">
                          <Input id="code" placeholder="123456" maxLength={6} />
                          <Button variant="outline">Renvoyer</Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setIsPhoneDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button onClick={() => setIsPhoneDialogOpen(false)}>
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonne de droite */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>OAuth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Configurez les paramètres OAuth pour votre compte.
              </p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>Configurer</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Configuration OAuth</DialogTitle>
                    <DialogDescription>
                      Connectez votre compte à des services tiers pour une
                      connexion simplifiée.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Github className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">GitHub</h4>
                          <p className="text-sm text-muted-foreground">
                            Connexion avec votre compte GitHub
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connecter
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Google</h4>
                          <p className="text-sm text-muted-foreground">
                            Connexion avec votre compte Google
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connecter
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Fermer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
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
              <Button variant="destructive">Désactiver</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
