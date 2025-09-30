"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";
import { Mail, CheckCircle } from "lucide-react";

export const EmailVerificationDialog = ({ isOpen, onClose, userEmail }) => {
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      // Utiliser l'API Better Auth pour renvoyer l'email de vérification
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          callbackURL: `${window.location.origin}/auth/verify-email`,
        }),
      });

      if (response.ok) {
        toast.success("Email de vérification envoyé avec succès !");
      } else {
        const errorData = await response.json();
        console.error("Erreur lors de l'envoi de l'email:", errorData);
        toast.error("Erreur lors de l'envoi de l'email de vérification");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      toast.error("Erreur lors de l'envoi de l'email de vérification");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <div className="relative z-[60] w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border p-6 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex flex-col gap-2 text-center sm:text-left mb-4">
              <h2 className="text-lg font-semibold">
                Vérification d'email requise
              </h2>
              <p className="text-muted-foreground text-sm">
                Votre compte n'a pas encore été vérifié. Pour des raisons de
                sécurité, vous devez vérifier votre adresse email avant de
                pouvoir vous connecter.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 p-3 rounded-lg border border-[#5a50ff]/20">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-[#5a50ff] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[#5a50ff] dark:text-[#5a50ff]">
                    <div className="font-medium mb-1">
                      Vérifiez votre boîte email :
                    </div>
                    <div className="text-[#5a50ff] dark:text-[#5a50ff] font-mono text-xs bg-[#5a50ff]/10 px-2 py-1 rounded">
                      {userEmail}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Si vous n'avez pas reçu l'email, vérifiez vos spams ou cliquez
                sur le bouton ci-dessous pour en recevoir un nouveau.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Fermer
              </Button>
              <SubmitButton
                onClick={handleResendVerification}
                isLoading={isResending}
                className="w-full sm:w-auto sm:min-w-[180px] font-normal cursor-pointer"
              >
                <Mail className="h-4 w-4 mr-2" />
                Renvoyer l'email
              </SubmitButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
