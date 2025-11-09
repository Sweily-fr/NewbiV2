"use client";

import { useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { InputOTP } from "@/src/components/ui/input-otp";
import { InputPassword } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "@/src/components/ui/sonner";
import {
  Shield,
  QrCode,
  Key,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import QRCodeReact from "react-qr-code";

/**
 * Dialog d'activation du 2FA
 * Étapes : 1. Mot de passe → 2. QR Code → 3. Vérification → 4. Codes de secours
 */
export function Enable2FADialog({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState(1); // 1: password, 2: qr, 3: verify, 4: backup codes
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 TEST : Log au montage du composant
  console.log("🔥🔥🔥 [ENABLE2FA] Composant monté ! Fichier TwoFactorDialogs.jsx chargé !");

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔐 [2FA] Tentative d'activation du 2FA...");
      
      const { data, error } = await authClient.twoFactor.enable({
        password: password,
        issuer: "Newbi",
      });

      console.log("🔐 [2FA] Réponse reçue:", { data, error });

      if (error) {
        console.error("❌ [2FA] Erreur:", error);
        setError(error.message || "Mot de passe incorrect");
        return;
      }

      if (data) {
        console.log("✅ [2FA] Données reçues:", {
          hasTotpURI: !!data.totpURI,
          hasBackupCodes: !!data.backupCodes,
          backupCodesCount: data.backupCodes?.length || 0
        });

        if (!data.totpURI) {
          console.error("❌ [2FA] Pas de totpURI dans la réponse");
          setError("Erreur: Impossible de générer le QR code. Veuillez réessayer.");
          return;
        }

        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes || []);
        console.log("✅ [2FA] Passage à l'étape 2 (QR code)");
        setStep(2); // Passer au QR code
      } else {
        console.error("❌ [2FA] Pas de données dans la réponse");
        setError("Erreur: Aucune donnée reçue. Veuillez réessayer.");
      }
    } catch (err) {
      console.error("❌ [2FA] Exception:", err);
      setError(`Une erreur est survenue: ${err.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    if (code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: code,
      });

      if (error) {
        setError(error.message || "Code invalide. Veuillez réessayer.");
        setVerificationCode("");
        return;
      }

      if (data) {
        setStep(4); // Passer aux codes de secours
        // Ne pas afficher le toast ici, attendre que l'utilisateur ait sauvegardé les codes
      }
    } catch (err) {
      console.error("Erreur vérification code:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setVerificationCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast.success("Codes de secours copiés !");
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newbi-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Codes de secours téléchargés !");
  };

  const handleClose = () => {
    // Ne permettre la fermeture que si on est à l'étape 4 (codes de secours) ou étape 1
    if (step !== 1 && step !== 4) {
      toast.error("Veuillez terminer le processus d'activation du 2FA");
      return;
    }
    
    setStep(1);
    setPassword("");
    setTotpUri("");
    setBackupCodes([]);
    setVerificationCode("");
    setError("");
    onOpenChange(false);
    
    // Si on ferme depuis l'étape 4, c'est que le 2FA est activé
    if (step === 4) {
      toast.success("2FA activé avec succès ! Vos codes de secours ont été sauvegardés.");
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          // Empêcher la fermeture en cliquant en dehors si on est en cours de processus
          if (step !== 1 && step !== 4) {
            e.preventDefault();
            toast.error("Veuillez terminer le processus d'activation du 2FA");
          }
        }}
        onEscapeKeyDown={(e) => {
          // Empêcher la fermeture avec Escape si on est en cours de processus
          if (step !== 1 && step !== 4) {
            e.preventDefault();
            toast.error("Veuillez terminer le processus d'activation du 2FA");
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Activer l'authentification à deux facteurs
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Confirmez votre mot de passe pour continuer"}
            {step === 2 && "Scannez ce QR code avec votre application d'authentification"}
            {step === 3 && "Entrez le code à 6 chiffres pour vérifier"}
            {step === 4 && "Sauvegardez ces codes de secours en lieu sûr"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Étape 1 : Mot de passe */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <InputPassword
                label="Mot de passe"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <Button type="submit" disabled={!password || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            </form>
          )}

          {/* Étape 2 : QR Code */}
          {step === 2 && totpUri && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <QRCodeReact value={totpUri} size={200} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">
                    Scannez avec Google Authenticator, Authy, ou une autre app
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Impossible de scanner ? Copiez la clé manuellement
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Code de configuration manuel</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                    {totpUri.split("secret=")[1]?.split("&")[0]}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        totpUri.split("secret=")[1]?.split("&")[0] || ""
                      );
                      toast.success("Clé copiée !");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep(3)} className="w-full">
                J'ai scanné le QR code
              </Button>
            </div>
          )}

          {/* Étape 3 : Vérification */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-center block">
                  Entrez le code à 6 chiffres depuis votre application
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    length={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    onComplete={handleVerifyCode}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={() => handleVerifyCode(verificationCode)}
                disabled={verificationCode.length !== 6 || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier et activer"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                disabled={isLoading}
                className="w-full"
              >
                Retour au QR code
              </Button>
            </div>
          )}

          {/* Étape 4 : Codes de secours */}
          {step === 4 && backupCodes.length > 0 && (
            <div className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>2FA activé avec succès !</strong> Votre compte est maintenant protégé par l'authentification à deux facteurs.
                </AlertDescription>
              </Alert>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important :</strong> Sauvegardez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Codes de secours</Label>
                <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>

              <Button onClick={handleClose} className="w-full">
                J'ai sauvegardé mes codes
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog de désactivation du 2FA
 */
export function Disable2FADialog({ open, onOpenChange, onSuccess }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.twoFactor.disable({
        password: password,
      });

      if (error) {
        setError(error.message || "Mot de passe incorrect");
        return;
      }

      if (data) {
        toast.success("2FA désactivé avec succès");
        setPassword("");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err) {
      console.error("Erreur désactivation 2FA:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Désactiver l'authentification à deux facteurs
          </DialogTitle>
          <DialogDescription>
            Votre compte sera moins sécurisé. Confirmez votre mot de passe pour continuer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDisable} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <InputPassword
            label="Mot de passe"
            placeholder="Entrez votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoFocus
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!password || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Désactivation...
                </>
              ) : (
                "Désactiver"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog pour afficher le QR code (pour utilisateurs ayant déjà activé le 2FA)
 */
export function Show2FAQRCodeDialog({ open, onOpenChange }) {
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);

  const handleGetQRCode = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.twoFactor.getTotpUri({
        password: password,
      });

      if (error) {
        setError(error.message || "Mot de passe incorrect");
        return;
      }

      if (data) {
        setTotpUri(data.totpURI);
        setShowQR(true);
      }
    } catch (err) {
      console.error("Erreur récupération QR code:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setTotpUri("");
    setShowQR(false);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            QR Code d'authentification
          </DialogTitle>
          <DialogDescription>
            {!showQR
              ? "Confirmez votre mot de passe pour afficher le QR code"
              : "Scannez ce code avec une nouvelle application d'authentification"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showQR ? (
            <form onSubmit={handleGetQRCode} className="space-y-4">
              <InputPassword
                label="Mot de passe"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <Button type="submit" disabled={!password || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  "Afficher le QR code"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <QRCodeReact value={totpUri} size={200} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Code de configuration manuel</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                    {totpUri.split("secret=")[1]?.split("&")[0]}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        totpUri.split("secret=")[1]?.split("&")[0] || ""
                      );
                      toast.success("Clé copiée !");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog pour générer de nouveaux codes de secours
 */
export function GenerateBackupCodesDialog({ open, onOpenChange }) {
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCodes, setShowCodes] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({
        password: password,
      });

      if (error) {
        setError(error.message || "Mot de passe incorrect");
        return;
      }

      if (data && data.backupCodes) {
        setBackupCodes(data.backupCodes);
        setShowCodes(true);
        toast.success("Nouveaux codes de secours générés !");
      }
    } catch (err) {
      console.error("Erreur génération codes:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast.success("Codes de secours copiés !");
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newbi-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Codes de secours téléchargés !");
  };

  const handleClose = () => {
    setPassword("");
    setBackupCodes([]);
    setShowCodes(false);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Générer de nouveaux codes de secours
          </DialogTitle>
          <DialogDescription>
            {!showCodes
              ? "Les anciens codes seront invalidés. Confirmez votre mot de passe."
              : "Sauvegardez ces nouveaux codes en lieu sûr"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showCodes ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Attention : Vos anciens codes de secours ne fonctionneront plus.
                </AlertDescription>
              </Alert>

              <InputPassword
                label="Mot de passe"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />

              <Button type="submit" disabled={!password || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Générer de nouveaux codes"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Chaque code ne peut être utilisé qu'une seule fois.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Nouveaux codes de secours</Label>
                <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>

              <Button onClick={handleClose} className="w-full">
                J'ai sauvegardé mes codes
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
