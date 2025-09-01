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
import { Smartphone, Key, Mail } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { OtpInput } from "@/src/components/otp-input";

export function Setup2FAModal({ isOpen, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1); // 1: choose method, 2: setup, 3: verify
  const [isLoading, setIsLoading] = useState(false);

  const methods = [
    {
      id: "sms",
      name: "SMS",
      description: "Recevoir un code par SMS",
      icon: Smartphone,
    },
    {
      id: "authenticator",
      name: "Application d'authentification",
      description: "Utiliser Google Authenticator ou similaire",
      icon: Key,
    },
    {
      id: "email",
      name: "E-mail",
      description: "Recevoir un code par e-mail",
      icon: Mail,
    },
  ];

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setStep(2);
  };

  const handleSetup = async () => {
    setIsLoading(true);

    try {
      // Vérifier que le mot de passe est fourni (requis par Better Auth)
      if (!password) {
        toast.error("Veuillez saisir votre mot de passe pour activer la 2FA");
        setIsLoading(false);
        return;
      }

      if (selectedMethod.id === "sms") {
        // Vérifier que l'utilisateur a un numéro de téléphone
        if (!phoneNumber) {
          toast.error("Veuillez saisir votre numéro de téléphone");
          setIsLoading(false);
          return;
        }

        // Activer la 2FA par SMS avec mot de passe requis
        const { data, error } = await authClient.twoFactor.enable({
          password: password,
          issuer: "Newbi",
        });

        if (error) {
          console.error("Erreur activation 2FA SMS:", error);
          toast.error(
            error.message || "Erreur lors de l'activation de la 2FA par SMS"
          );
          return;
        }

        console.log("2FA SMS activée:", data);
        toast.success("Code de vérification envoyé par SMS");
      } else if (selectedMethod.id === "email") {
        // Activer la 2FA par email avec mot de passe requis
        const { data, error } = await authClient.twoFactor.enable({
          password: password,
          issuer: "Newbi",
        });

        if (error) {
          console.error("Erreur activation 2FA email:", error);
          toast.error(
            error.message || "Erreur lors de l'activation de la 2FA par email"
          );
          return;
        }

        console.log("2FA email activée:", data);
        toast.success("Code de vérification envoyé par e-mail");
      } else {
        // Pour l'authenticator TOTP
        const { data, error } = await authClient.twoFactor.enable({
          password: password,
          issuer: "Newbi",
        });

        if (error) {
          console.error("Erreur activation 2FA TOTP:", error);
          toast.error(error.message || "Erreur lors de l'activation de la 2FA");
          return;
        }

        console.log("2FA TOTP activée:", data);
        toast.success(
          "QR code généré pour votre application d'authentification"
        );
      }

      setStep(3);
    } catch (error) {
      console.error("Erreur configuration 2FA:", error);
      toast.error("Erreur lors de la configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeWithValue = async (code) => {
    if (!code || code.length !== 6) return;

    setIsLoading(true);

    try {
      // Vérifier le code OTP pour finaliser l'activation 2FA
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code: code,
      });

      if (error) {
        console.error("Erreur vérification 2FA:", error);
        toast.error(error.message || "Code de vérification incorrect");
        setVerificationCode("");
        return;
      }

      console.log("2FA vérifiée avec succès:", data);
      toast.success("Vérification en 2 étapes activée avec succès");
      handleClose();
    } catch (error) {
      console.error("Erreur vérification 2FA:", error);
      toast.error("Code de vérification incorrect");
      setVerificationCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Veuillez saisir un code à 6 chiffres");
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier le code OTP pour finaliser l'activation 2FA
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code: verificationCode,
      });

      if (error) {
        console.error("Erreur vérification 2FA:", error);
        toast.error(error.message || "Code de vérification incorrect");
        setVerificationCode("");
        return;
      }

      console.log("2FA vérifiée avec succès:", data);
      toast.success("Vérification en 2 étapes activée avec succès");
      handleClose();
    } catch (error) {
      console.error("Erreur vérification 2FA:", error);
      toast.error("Code de vérification incorrect");
      setVerificationCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setPhoneNumber("");
    setPassword("");
    setVerificationCode("");
    setStep(1);
    onClose();
  };

  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Ajouter une méthode de vérification</DialogTitle>
        <DialogDescription>
          Choisissez comment vous souhaitez recevoir vos codes de vérification.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <Button
              key={method.id}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleMethodSelect(method)}
            >
              <Icon className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-muted-foreground">
                  {method.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleClose}>
          Annuler
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep2 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Configuration - {selectedMethod?.name}</DialogTitle>
        <DialogDescription>
          {selectedMethod?.id === "sms" &&
            "Saisissez votre numéro de téléphone pour recevoir les codes par SMS."}
          {selectedMethod?.id === "authenticator" &&
            "Scannez le QR code avec votre application d'authentification."}
          {selectedMethod?.id === "email" &&
            "Les codes seront envoyés à votre adresse e-mail actuelle."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Mot de passe requis pour tous les types de 2FA */}
        <div>
          <Label htmlFor="password">Mot de passe actuel</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Requis pour activer la vérification en 2 étapes
          </p>
        </div>

        {selectedMethod?.id === "sms" && (
          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="mt-2"
            />
          </div>
        )}

        {selectedMethod?.id === "authenticator" && (
          <div className="text-center">
            <div className="w-48 h-48 bg-gray-100 mx-auto mb-4 flex items-center justify-center rounded-lg">
              <div className="text-sm text-muted-foreground">QR Code</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Scannez ce code avec Google Authenticator, Authy ou une autre
              application compatible.
            </p>
          </div>
        )}

        {selectedMethod?.id === "email" && (
          <div className="text-center py-4">
            <Mail className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Les codes seront envoyés à votre adresse e-mail actuelle.
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          Retour
        </Button>
        <Button onClick={handleSetup} disabled={isLoading}>
          {isLoading ? "Configuration..." : "Continuer"}
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep3 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Vérification</DialogTitle>
        <DialogDescription>
          Saisissez le code de vérification à 6 chiffres que vous avez reçu.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="text-center">
          <Label htmlFor="verification-code">Code de vérification</Label>
          <div className="mt-4 flex justify-center">
            <OtpInput
              value={verificationCode}
              onChange={(value) => {
                setVerificationCode(value);
                // Vérification automatique quand le code est complet
                if (value.length === 6) {
                  handleVerifyCodeWithValue(value);
                }
              }}
              maxLength={6}
              disabled={isLoading}
            />
          </div>
          {isLoading && (
            <div className="mt-4 text-sm text-muted-foreground">
              Vérification en cours...
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}
