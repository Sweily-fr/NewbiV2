"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { OtpInput } from "@/src/components/otp-input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Shield,
  Key,
  Loader2,
  ChartSpline,
  Send,
  Calendar,
  FileChartColumn,
  ChartPie,
  LoaderCircleIcon,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerifyTOTP = async (otpCode) => {
    if (otpCode.length !== 6) return;

    setIsVerifying(true);

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: otpCode,
        trustDevice: trustDevice,
      });

      if (error) {
        toast.error(
          "Le code saisi est incorrect. Vérifiez votre application d'authentification et réessayez."
        );
        setCode(""); // Réinitialiser le code
        return;
      }

      if (data) {
        toast.success("Authentification réussie !");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Erreur vérification 2FA:", err);
      toast.error(
        "Une erreur s'est produite lors de la vérification. Veuillez réessayer."
      );
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!code || code.length < 10) {
      toast.error("Le code de secours doit contenir au moins 10 caractères.");
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await authClient.twoFactor.verifyBackupCode({
        code: code,
        trustDevice: trustDevice,
      });

      if (error) {
        toast.error(
          "Le code de secours saisi est incorrect ou a déjà été utilisé."
        );
        setCode("");
        return;
      }

      if (data) {
        toast.success("Authentification réussie avec le code de secours !");
        toast.info("Ce code de secours ne peut plus être utilisé.");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Erreur vérification code de secours:", err);
      toast.error(
        "Une erreur s'est produite lors de la vérification. Veuillez réessayer."
      );
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Composant pour les icônes décoratives
  const IconCard = ({ children, className, borderClassName }) => {
    return (
      <div
        className={cn(
          "bg-background relative flex size-20 rounded-xl dark:bg-transparent",
          className
        )}
      >
        <div
          role="presentation"
          className={cn(
            "absolute inset-0 rounded-xl border border-black/5 dark:border-white/10",
            borderClassName
          )}
        />
        <div className="relative z-20 m-auto size-fit *:size-6">{children}</div>
      </div>
    );
  };

  return (
    <section>
      <div className="bg-white dark:bg-background py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          {/* Grille d'icônes décoratives */}
          <div className="relative mx-auto w-fit">
            <div
              role="presentation"
              className="absolute inset-0 z-10 bg-gradient-radial from-transparent via-transparent to-white dark:to-background"
              style={{
                background:
                  "radial-gradient(circle, transparent 0%, transparent 40%, white 75%, white 100%)",
              }}
            ></div>
            <div className="mx-auto mb-2 flex w-fit justify-center gap-2">
              <IconCard>
                <ChartSpline className="text-gray-200 w-6 h-6" />
              </IconCard>
              <IconCard>
                <Send className="text-gray-200 w-6 h-6" />
              </IconCard>
            </div>
            <div className="mx-auto my-2 flex w-fit justify-center gap-2">
              <IconCard>
                <Key className="text-gray-200 w-6 h-6" />
              </IconCard>

              <IconCard
                borderClassName="shadow-black-950/10 shadow-xl border-black/5 dark:border-white/10"
                className="dark:bg-white/10"
              >
                <Shield className="w-6 h-6 text-[#5b4fff]" />
              </IconCard>
              <IconCard>
                <Calendar className="text-gray-200 w-6 h-6" />
              </IconCard>
            </div>

            <div className="mx-auto flex w-fit justify-center gap-2">
              <IconCard>
                <FileChartColumn className="text-gray-200 w-6 h-6" />
              </IconCard>

              <IconCard>
                <ChartPie className="text-gray-200 w-6 h-6" />
              </IconCard>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="mx-auto mt-6 max-w-lg space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-balance text-2xl font-medium md:text-3xl">
                Vérification en deux étapes
              </h2>
              <p className="text-muted-foreground text-sm">
                {useBackupCode
                  ? "Entrez un code de secours pour vous connecter"
                  : "Entrez le code à 6 chiffres depuis votre application d'authentification"}
              </p>
            </div>

            {/* Contenu selon le mode */}
            <div className="space-y-6 pt-4">
              {!useBackupCode ? (
                <>
                  {/* Input OTP pour TOTP */}
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <OtpInput
                        value={code}
                        onChange={(value) => {
                          setCode(value);
                          // Vérification automatique quand le code est complet
                          if (value.length === 6) {
                            handleVerifyTOTP(value);
                          }
                        }}
                        maxLength={6}
                        disabled={isVerifying}
                      />
                    </div>
                  </div>

                  {/* Option "Faire confiance à cet appareil" */}
                  <div className="flex items-center justify-center space-x-2">
                    <Checkbox
                      id="trust-device"
                      checked={trustDevice}
                      onCheckedChange={setTrustDevice}
                      disabled={isVerifying}
                    />
                    <Label
                      htmlFor="trust-device"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Faire confiance à cet appareil pendant 60 jours
                    </Label>
                  </div>

                  {/* Bouton de vérification */}
                  <Button
                    onClick={() => handleVerifyTOTP(code)}
                    disabled={code.length !== 6 || isVerifying}
                    className="w-1/2 bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      "Vérifier"
                    )}
                  </Button>

                  {/* Lien vers codes de secours */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCode(true);
                        setCode("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                      disabled={isVerifying}
                    >
                      Utiliser un code de secours
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Input pour code de secours */}
                  <div className="space-y-4">
                    <input
                      id="backup-code"
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\s/g, ""))
                      }
                      placeholder="Entrez votre code de secours"
                      disabled={isVerifying}
                      autoFocus
                      className="flex h-12 w-full rounded-md border border-input bg-transparent px-4 py-2 text-center text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Les codes de secours sont générés lors de l'activation du
                      2FA
                    </p>
                  </div>

                  {/* Option "Faire confiance à cet appareil" */}
                  <div className="flex items-center justify-center space-x-2">
                    <Checkbox
                      id="trust-device-backup"
                      checked={trustDevice}
                      onCheckedChange={setTrustDevice}
                      disabled={isVerifying}
                    />
                    <Label
                      htmlFor="trust-device-backup"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Faire confiance à cet appareil pendant 60 jours
                    </Label>
                  </div>

                  {/* Bouton de vérification */}
                  <Button
                    onClick={handleVerifyBackupCode}
                    disabled={!code || code.length < 10 || isVerifying}
                    className="w-full bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      "Vérifier le code de secours"
                    )}
                  </Button>

                  {/* Retour au code TOTP */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCode(false);
                        setCode("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                      disabled={isVerifying}
                    >
                      Utiliser le code d'authentification
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
