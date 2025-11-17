import React, { useState, useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Shield,
  Key,
  Smartphone,
  Github,
  Mail,
  CheckCircle,
  XCircle,
  Settings,
  AlertCircle,
  Landmark,
  Trash2,
  QrCode,
} from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  Enable2FADialog,
  Disable2FADialog,
  Show2FAQRCodeDialog,
  GenerateBackupCodesDialog,
} from "./TwoFactorDialogs";

import { toast } from "@/src/components/ui/sonner";

export default function SecuritySection({ session }) {
  const [isOAuthDialogOpen, setIsOAuthDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isDeletingBridgeUser, setIsDeletingBridgeUser] = useState(false);
  
  // États pour les dialogs 2FA
  const [isEnable2FAOpen, setIsEnable2FAOpen] = useState(false);
  const [isDisable2FAOpen, setIsDisable2FAOpen] = useState(false);
  const [isShowQROpen, setIsShowQROpen] = useState(false);
  const [isGenerateBackupCodesOpen, setIsGenerateBackupCodesOpen] = useState(false);

  // Hook workspace
  const { workspaceId } = useWorkspace();

  // Simuler l'état des connexions OAuth
  const [oauthConnections, setOauthConnections] = useState({
    github: false,
    google: false,
  });

  const handleOAuthConnect = (provider) => {
    // Ici vous implémenteriez la logique de connexion OAuth
    setOauthConnections((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  // Fonction pour supprimer l'utilisateur Bridge
  const handleDeleteBridgeUser = async () => {
    if (!workspaceId) {
      toast.error("Workspace non trouvé");
      return;
    }

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer votre connexion bancaire ? Cette action supprimera tous vos comptes et transactions synchronisés."
      )
    ) {
      return;
    }

    setIsDeletingBridgeUser(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/banking/user`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Connexion bancaire supprimée avec succès. ${data.deletedAccounts} comptes et ${data.deletedTransactions} transactions supprimés.`
        );
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression utilisateur Bridge:", error);
      toast.error("Erreur lors de la suppression de la connexion bancaire");
    } finally {
      setIsDeletingBridgeUser(false);
    }
  };

  // Rafraîchir la session après activation/désactivation 2FA
  const handle2FASuccess = () => {
    // Recharger la page pour mettre à jour la session
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Dialogs 2FA */}
      <Enable2FADialog
        open={isEnable2FAOpen}
        onOpenChange={setIsEnable2FAOpen}
        onSuccess={handle2FASuccess}
      />
      <Disable2FADialog
        open={isDisable2FAOpen}
        onOpenChange={setIsDisable2FAOpen}
        onSuccess={handle2FASuccess}
      />
      <Show2FAQRCodeDialog
        open={isShowQROpen}
        onOpenChange={setIsShowQROpen}
      />
      <GenerateBackupCodesDialog
        open={isGenerateBackupCodesOpen}
        onOpenChange={setIsGenerateBackupCodesOpen}
      />

      {/* Mot de passe et 2FA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              Mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-normal">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">Compte principal</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <p className="text-sm font-normal">Sécurité du mot de passe</p>
                <p className="text-xs text-muted-foreground">
                  Dernière modification il y a 3 mois
                </p>
              </div>
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Authentification à deux facteurs (2FA) */}
        <Card className="border-0 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <div className="p-2 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              Authentification à deux facteurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                      {session?.user?.twoFactorEnabled ? "Activé" : "Désactivé"}
                    </p>
                    {session?.user?.twoFactorEnabled && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-normal">
                          Actif
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.twoFactorEnabled
                      ? "Votre compte est protégé par une authentification à deux facteurs"
                      : "Renforcez la sécurité de votre compte avec le 2FA"}
                  </p>
                </div>
                {session?.user?.twoFactorEnabled ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactif
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {session?.user?.twoFactorEnabled ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsShowQROpen(true)}
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Voir QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGenerateBackupCodesOpen(true)}
                      className="flex-1"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Codes de secours
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDisable2FAOpen(true)}
                    className="w-full"
                  >
                    Désactiver le 2FA
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsEnable2FAOpen(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Activer le 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banking integration section - to be replaced with new API */}
      {/* <div className="gap-6">
        <Card className="border-0 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <div className="p-2 bg-green-50 rounded-lg">
                <Landmark className="h-5 w-5 text-green-600" />
              </div>
              Connexion bancaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                    Intégration bancaire Bridge
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gérez votre connexion aux services bancaires
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteBridgeUser}
                disabled={isDeletingBridgeUser || !workspaceId}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeletingBridgeUser
                  ? "Suppression..."
                  : "Supprimer l'utilisateur"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Authentification */}
      {/* <Card className="border-0 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-medium">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            Authentification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-normal">Connexions OAuth</h4>
              <p className="text-xs text-muted-foreground">
                Connectez vos comptes sociaux pour une connexion rapide
              </p>
            </div>
            <Dialog
              open={isOAuthDialogOpen}
              onOpenChange={setIsOAuthDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Gérer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Configuration OAuth
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Gérez vos connexions aux services externes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Github className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">GitHub</p>
                        <p className="text-sm text-gray-500">
                          Connexion avec votre compte GitHub
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {oauthConnections.github ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-600">
                            Connecté
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-500">
                            Non connecté
                          </span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={
                          oauthConnections.github ? "outline" : "destructive"
                        }
                        onClick={() => handleOAuthConnect("github")}
                        className={
                          oauthConnections.github
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                        }
                      >
                        {oauthConnections.github ? "Déconnecter" : "Connecter"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <Mail className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Google</p>
                        <p className="text-sm text-gray-500">
                          Connexion avec votre compte Google
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {oauthConnections.google ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-600">
                            Connecté
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-500">
                            Non connecté
                          </span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={
                          oauthConnections.google ? "outline" : "destructive"
                        }
                        onClick={() => handleOAuthConnect("google")}
                        className={
                          oauthConnections.google
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }
                      >
                        {oauthConnections.google ? "Déconnecter" : "Connecter"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-normal">
                Numéro de téléphone de récupération
              </h4>
              <p className="text-xs text-muted-foreground">
                Utilisé pour la récupération de compte
              </p>
            </div>
            <Dialog
              open={isPhoneDialogOpen}
              onOpenChange={setIsPhoneDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Numéro de téléphone
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Ajoutez un numéro de téléphone pour sécuriser votre compte
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-900"
                    >
                      Numéro de téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 border-gray-200"
                    onClick={handleSendVerificationCode}
                  >
                    Envoyer le code de vérification
                  </Button>

                  <div className="space-y-2">
                    <Label
                      htmlFor="verification-code"
                      className="text-sm font-medium text-gray-900"
                    >
                      Code de vérification
                    </Label>
                    <Input
                      id="verification-code"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={handlePhoneVerification}
                    >
                      Vérifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSendVerificationCode}
                      className="bg-white hover:bg-gray-50 border-gray-200"
                    >
                      Renvoyer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
