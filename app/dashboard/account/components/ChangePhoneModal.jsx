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
import { authClient } from "@/src/lib/auth-client";
import { OtpInput } from "@/src/components/otp-input";

export function ChangePhoneModal({ isOpen, onClose, currentPhone }) {
  const [newPhone, setNewPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1); // 1: enter phone, 2: verify code
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!newPhone.trim()) {
      toast.error("Veuillez saisir un numéro de téléphone");
      return;
    }

    if (newPhone === currentPhone) {
      toast.error("Le nouveau numéro doit être différent de l'actuel");
      return;
    }

    setIsLoading(true);

    try {
      // Envoi du code OTP via Better Auth
      const { data, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber: newPhone,
      });

      if (error) {
        console.error("Erreur Better Auth:", error);
        toast.error(error.message || "Erreur lors de l'envoi du code");
        return;
      }

      console.log("Code envoyé avec succès:", data);
      toast.success("Code de vérification envoyé par SMS");
      setStep(2);
    } catch (error) {
      console.error("Erreur lors de l'envoi du code:", error);
      toast.error("Erreur lors de l'envoi du code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeWithValue = async (code) => {
    console.log("handleVerifyCodeWithValue appelé avec code:", code);
    if (!code || code.length !== 6) {
      console.log("Code invalide, longueur:", code?.length);
      return;
    }

    console.log("Début de la vérification...");
    setIsLoading(true);

    try {
      // Vérification du code OTP et mise à jour du numéro via Better Auth
      const { data, error } = await authClient.phoneNumber.verify({
        phoneNumber: newPhone,
        code: code,
        updatePhoneNumber: true,
      });

      if (error) {
        console.error("Erreur de vérification:", error);
        toast.error(error.message || "Code de vérification incorrect");
        setVerificationCode(""); // Réinitialiser le code en cas d'erreur
        return;
      }

      console.log("Numéro vérifié avec succès:", data);
      toast.success("Numéro de téléphone modifié avec succès");
      handleClose();

      // Optionnel: rafraîchir la session pour mettre à jour les données utilisateur
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      toast.error("Code de vérification incorrect");
      setVerificationCode(""); // Réinitialiser le code en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    console.log("handleVerifyCode appelé avec code:", verificationCode);
    if (!verificationCode || verificationCode.length !== 6) {
      console.log("Code invalide, longueur:", verificationCode?.length);
      return;
    }

    console.log("Début de la vérification...");
    setIsLoading(true);

    try {
      // Vérification du code OTP et mise à jour du numéro via Better Auth
      const { data, error } = await authClient.phoneNumber.verify({
        phoneNumber: newPhone,
        code: verificationCode,
        updatePhoneNumber: true,
      });

      if (error) {
        console.error("Erreur de vérification:", error);
        toast.error(error.message || "Code de vérification incorrect");
        setVerificationCode(""); // Réinitialiser le code en cas d'erreur
        return;
      }

      console.log("Numéro vérifié avec succès:", data);
      toast.success("Numéro de téléphone modifié avec succès");
      handleClose();

      // Optionnel: rafraîchir la session pour mettre à jour les données utilisateur
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      toast.error("Code de vérification incorrect");
      setVerificationCode(""); // Réinitialiser le code en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPhone("");
    setVerificationCode("");
    setStep(1);
    onClose();
  };

  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Modifier le numéro de téléphone</DialogTitle>
        <DialogDescription>
          Saisissez votre nouveau numéro de téléphone. Un code de vérification
          sera envoyé par SMS.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <Label htmlFor="current-phone">Numéro actuel</Label>
          <Input
            id="current-phone"
            type="tel"
            value={currentPhone || "Non renseigné"}
            disabled
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="new-phone">Nouveau numéro de téléphone</Label>
          <Input
            id="new-phone"
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            required
            className="mt-2"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Envoi..." : "Envoyer le code"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );

  const renderStep2 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Vérification</DialogTitle>
        <DialogDescription>
          Saisissez le code de vérification à 6 chiffres envoyé au {newPhone}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <OtpInput
            value={verificationCode}
            onChange={(value) => {
              console.log("OTP onChange:", value, "length:", value.length);
              setVerificationCode(value);
              // Vérification automatique quand 6 chiffres sont saisis
              console.log(value.length, "length");
              if (value.length === 6) {
                console.log("Déclenchement de la vérification automatique");
                setTimeout(() => {
                  console.log("Exécution de handleVerifyCode avec code:", value);
                  // Utiliser directement la valeur reçue au lieu de verificationCode
                  handleVerifyCodeWithValue(value);
                }, 100);
              }
            }}
            maxLength={6}
            label="Code de vérification"
            disabled={isLoading}
          />
          {isLoading && (
            <p className="text-sm text-muted-foreground mt-2">
              Vérification en cours...
            </p>
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          Vous n'avez pas reçu le code ?{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal text-sm"
            onClick={handleSendCode}
            disabled={isLoading}
          >
            Renvoyer
          </Button>
        </div>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Modifier le numéro
          </Button>
        </div>
      </div>
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
