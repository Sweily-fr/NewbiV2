"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { OtpInput } from "@/src/components/otp-input";

export function TwoFactorModal({ isOpen, onClose, onVerify }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyCodeWithValue = async (code) => {
    if (!code || code.length !== 6) return;

    setIsLoading(true);
    
    try {
      const success = await onVerify(code);
      if (success) {
        onClose();
      } else {
        setVerificationCode("");
      }
    } catch (error) {
      console.error("Erreur vérification 2FA:", error);
      setVerificationCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setVerificationCode("");
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vérification en 2 étapes</DialogTitle>
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
      </DialogContent>
    </Dialog>
  );
}
