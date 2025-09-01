"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { Fingerprint, Smartphone, Laptop } from "lucide-react";

export function AddPasskeyModal({ isOpen, onClose }) {
  const [passkeyName, setPasskeyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: name, 2: create

  const deviceTypes = [
    {
      id: "mobile",
      name: "Téléphone",
      description: "Touch ID, Face ID ou empreinte digitale",
      icon: Smartphone,
    },
    {
      id: "laptop",
      name: "Ordinateur portable",
      description: "Windows Hello ou Touch ID",
      icon: Laptop,
    },
    {
      id: "biometric",
      name: "Authentification biométrique",
      description: "Empreinte digitale ou reconnaissance faciale",
      icon: Fingerprint,
    },
  ];

  const handleCreatePasskey = async () => {
    if (!passkeyName.trim()) {
      toast.error("Veuillez donner un nom à votre clé d'accès");
      return;
    }

    setIsLoading(true);
    setStep(2);
    
    try {
      // TODO: Implémenter la création de passkey avec WebAuthn
      console.log("Création de passkey:", passkeyName);
      
      // Simulation de la création WebAuthn
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Clé d'accès ajoutée avec succès");
      handleClose();
    } catch (error) {
      toast.error("Erreur lors de la création de la clé d'accès");
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPasskeyName("");
    setStep(1);
    onClose();
  };

  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Ajouter une clé d'accès</DialogTitle>
        <DialogDescription>
          Les clés d'accès vous permettent de vous connecter en toute sécurité avec votre empreinte digitale, votre visage ou votre code PIN.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="passkey-name">Nom de la clé d'accès</Label>
          <Input
            id="passkey-name"
            type="text"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            placeholder="Mon iPhone, Mon MacBook..."
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Donnez un nom pour identifier facilement cette clé d'accès.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Appareils compatibles</Label>
          <div className="grid gap-2">
            {deviceTypes.map((device) => {
              const Icon = device.icon;
              return (
                <div
                  key={device.id}
                  className="flex items-center p-3 border rounded-lg bg-muted/30"
                >
                  <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{device.name}</div>
                    <div className="text-xs text-muted-foreground">{device.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleClose}>
          Annuler
        </Button>
        <Button onClick={handleCreatePasskey} disabled={isLoading}>
          Créer la clé d'accès
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep2 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Création en cours...</DialogTitle>
        <DialogDescription>
          Suivez les instructions de votre appareil pour créer votre clé d'accès.
        </DialogDescription>
      </DialogHeader>
      
      <div className="text-center py-8">
        <Fingerprint className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
        <h3 className="font-medium mb-2">Authentifiez-vous sur votre appareil</h3>
        <p className="text-sm text-muted-foreground">
          Utilisez votre empreinte digitale, votre visage ou votre code PIN pour créer votre clé d'accès.
        </p>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Nom de la clé d'accès</h4>
        <p className="text-sm text-muted-foreground">{passkeyName}</p>
      </div>
      
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClose}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
