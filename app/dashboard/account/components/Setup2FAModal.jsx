"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { toast } from "@/src/components/ui/sonner";
import {
  Shield,
  Key,
  Mail,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { OtpInput } from "@/src/components/otp-input";
import QRCodeReact from "react-qr-code";

export function Setup2FAModal({ isOpen, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);

  const methods = [
    {
      id: "authenticator",
      name: "Application d'authentification",
      description: "Google Authenticator, Authy ou similaire",
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
      if (!password) {
        toast.error("Veuillez saisir votre mot de passe");
        setIsLoading(false);
        return;
      }

      if (selectedMethod.id === "sms") {
        if (!phoneNumber) {
          toast.error("Veuillez saisir votre numéro de téléphone");
          setIsLoading(false);
          return;
        }

        const { data, error } = await authClient.twoFactor.enable({
          password: password,
          issuer: "Newbi",
        });

        if (error) {
          toast.error(error.message || "Erreur lors de l'activation");
          return;
        }

        toast.success("Code envoyé par SMS");
      } else if (selectedMethod.id === "email") {
        const { data, error } = await authClient.twoFactor.enable({
          password: password,
          issuer: "Newbi",
          type: "otp",
        });

        if (error) {
          toast.error(error.message || "Erreur lors de l'activation");
          return;
        }

        toast.success("Code envoyé par e-mail");
      } else {
        const { data, error } = await authClient.twoFactor.enable({
          password: password,
          issuer: "Newbi",
          type: "totp",
        });

        if (error) {
          toast.error(error.message || "Erreur lors de l'activation");
          return;
        }

        if (data && data.totpURI) {
          setTotpUri(data.totpURI);
          setBackupCodes(data.backupCodes || []);
          return;
        } else {
          toast.error("Impossible de générer le QR code");
          return;
        }
      }

      setStep(3);
    } catch (error) {
      toast.error("Erreur lors de la configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeWithValue = async (code) => {
    if (!code || code.length !== 6) return;

    setIsLoading(true);

    try {
      const isTotp = selectedMethod?.id === "authenticator";
      const { data, error } = isTotp
        ? await authClient.twoFactor.verifyTotp({ code: code })
        : await authClient.twoFactor.verifyOtp({ code: code });

      if (error) {
        toast.error(error.message || "Code incorrect");
        setVerificationCode("");
        return;
      }

      toast.success("Vérification en 2 étapes activée");
      handleClose();
    } catch (error) {
      toast.error("Code incorrect");
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
    setTotpUri("");
    setBackupCodes([]);
    onClose();
  };

  // ── Step 1 : Choix de la méthode ──
  const renderStep1 = () => (
    <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
      <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
        <DialogTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="size-4" />
          Ajouter une méthode de vérification
        </DialogTitle>
      </DialogHeader>

      <div className="px-5 pt-3 pb-4 space-y-2">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              type="button"
              key={method.id}
              onClick={() => handleMethodSelect(method)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#fbfbfb] dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{method.name}</p>
                <p className="text-xs text-gray-400">{method.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2 : Configuration ──
  const renderStep2 = () => (
    <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
      <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
        <DialogTitle className="text-sm font-medium flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setStep(1); setTotpUri(""); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          {selectedMethod?.name}
        </DialogTitle>
      </DialogHeader>

      <div className="px-5 pt-3 pb-4 space-y-4">
        {/* Mot de passe */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Mot de passe actuel
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="h-9"
            required
          />
          <p className="text-[11px] text-gray-400">
            Requis pour activer la vérification en 2 étapes.
          </p>
        </div>

        {/* SMS */}
        {selectedMethod?.id === "sms" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Numéro de téléphone
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="h-9"
            />
          </div>
        )}

        {/* Authenticator */}
        {selectedMethod?.id === "authenticator" && (
          <div className="space-y-3">
            {totpUri ? (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl border border-[#eeeff1]">
                  <QRCodeReact value={totpUri} size={160} />
                </div>
                <p className="text-xs text-gray-400 text-center max-w-[280px]">
                  Scannez ce QR code avec votre application d'authentification.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-40 h-40 bg-[#fbfbfb] dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] rounded-xl flex items-center justify-center">
                  <p className="text-[11px] text-gray-400 text-center px-4">
                    Le QR code apparaîtra après validation
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email */}
        {selectedMethod?.id === "email" && (
          <div className="flex items-center gap-3 bg-[#f8f9fa] dark:bg-[#141414] border border-[#eeeff1] dark:border-[#232323] rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1a1a1a] border border-[#eeeff1] dark:border-[#232323] flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              Les codes seront envoyés à votre adresse e-mail actuelle.
            </p>
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end gap-2 pt-1">
          {selectedMethod?.id === "authenticator" && totpUri ? (
            <Button
              size="sm"
              onClick={() => setStep(3)}
              className="bg-[#5a50ff] hover:bg-[#4a40ee] text-white cursor-pointer"
            >
              J'ai scanné le QR code
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSetup}
              disabled={isLoading}
              className="bg-[#5a50ff] hover:bg-[#4a40ee] text-white cursor-pointer"
            >
              {isLoading && <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {isLoading ? "Configuration..." : "Continuer"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Step 3 : Vérification ──
  const renderStep3 = () => (
    <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
      <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
        <DialogTitle className="text-sm font-medium flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          Vérification
        </DialogTitle>
      </DialogHeader>

      <div className="px-5 pt-4 pb-5 space-y-4">
        <p className="text-xs text-gray-400 text-center">
          Saisissez le code à 6 chiffres que vous avez reçu.
        </p>

        <div className="flex justify-center">
          <OtpInput
            value={verificationCode}
            onChange={(value) => {
              setVerificationCode(value);
              if (value.length === 6) {
                handleVerifyCodeWithValue(value);
              }
            }}
            maxLength={6}
            disabled={isLoading}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Vérification...</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}
