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
  CreditCard,
  ExternalLink,
  AlertCircle,
  Landmark,
} from "lucide-react";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { useBridge } from "@/src/hooks/useBridge";

import { toast } from "@/src/components/ui/sonner";

export default function SecuritySection({ session }) {
  const [isOAuthDialogOpen, setIsOAuthDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Simuler l'état des connexions OAuth
  const [oauthConnections, setOauthConnections] = useState({
    github: false,
    google: false,
  });

  // Hook Stripe Connect avec GraphQL
  const {
    isConnected: stripeConnected,
    canReceivePayments,
    accountStatus,
    isLoading: isStripeLoading,
    error: stripeError,
    stripeAccount,
    connectStripe,
    disconnectStripe,
    openStripeDashboard,
    refetchStatus,
    clearError,
  } = useStripeConnect(session?.user?.id);

  // Hook Bridge pour la gestion des comptes bancaires
  const {
    bridgeUserId,
    isConnected: bridgeConnected,
    loading: bridgeLoading,
    isDisconnecting: bridgeDisconnecting,
    disconnectBridge,
    accounts: bridgeAccounts,
    loadingAccounts: bridgeAccountsLoading,
    accountsError: bridgeAccountsError,
    refetchAccounts,
  } = useBridge();

  const handleOAuthConnect = (provider) => {
    // Ici vous implémenteriez la logique de connexion OAuth
    setOauthConnections((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handlePhoneVerification = () => {
    // Ici vous implémenteriez la logique de vérification du téléphone
    console.log("Vérification du téléphone:", phoneNumber, verificationCode);
  };

  const handleSendVerificationCode = () => {
    // Ici vous implémenteriez l'envoi du code de vérification
    console.log("Envoi du code de vérification à:", phoneNumber);
  };

  // Gérer les erreurs Stripe
  useEffect(() => {
    if (stripeError) {
      console.error("Erreur Stripe:", stripeError);
      // Ici vous pourriez afficher une notification d'erreur
    }
  }, [stripeError]);

  // Gérer les paramètres de retour de Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get("stripe_success");
    const stripeRefresh = urlParams.get("stripe_refresh");

    if (stripeSuccess === "true") {
      // Rafraîchir les données Stripe pour mettre à jour le statut
      refetchStatus();
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Ici vous pourriez afficher une notification de succès
    } else if (stripeRefresh === "true") {
      // L'utilisateur a rafraîchi ou annulé le processus
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchStatus]);

  const handleStripeConnect = async () => {
    if (session?.user?.email) {
      await connectStripe(session.user.email);
    }
  };

  const handleStripeDisconnect = async () => {
    await disconnectStripe();
  };

  const handleBridgeDisconnect = async () => {
    try {
      const success = await disconnectBridge();
      if (success) {
        toast.success("Compte bancaire déconnecté avec succès");
      } else {
        toast.error("Erreur lors de la déconnexion du compte bancaire");
      }
    } catch (error) {
      console.error("Erreur déconnexion Bridge:", error);
      toast.error("Erreur lors de la déconnexion du compte bancaire");
    }
  };

  return (
    <div className="space-y-6">
      {/* Mot de passe */}
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
        {/* Stripe Connect */}
        <Card className="border-0 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              Stripe Connect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                      Stripe Connect
                    </p>
                    {stripeConnected && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-normal">
                          {canReceivePayments
                            ? "Actif"
                            : "Configuration requise"}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stripeConnected
                      ? canReceivePayments
                        ? "Recevez des paiements pour vos transferts de fichiers"
                        : "Finalisation de la configuration requise"
                      : "Connectez votre compte pour recevoir des paiements"}
                  </p>
                  {stripeAccount && (
                    <div className="mt-1">
                      {accountStatus !== "active" && (
                        <p className="text-xs text-amber-600">
                          Statut:{" "}
                          {accountStatus === "pending"
                            ? "En attente de vérification"
                            : "Action requise"}
                        </p>
                      )}
                      {stripeAccount && !stripeAccount.isOnboarded && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Configuration incomplète - Certaines actions sont
                          requises pour activer votre compte
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {stripeConnected && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-normal text-green-600">
                      Actif
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {stripeConnected ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (stripeAccount && !stripeAccount.isOnboarded) {
                        if (
                          confirm(
                            "Votre compte Stripe nécessite une configuration supplémentaire. Continuer vers le tableau de bord Stripe pour compléter la configuration ?"
                          )
                        ) {
                          openStripeDashboard();
                        }
                      } else {
                        openStripeDashboard();
                      }
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tableau de bord
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStripeDisconnect}
                    disabled={isStripeLoading}
                    // className="border-red-400 text-red-600"
                  >
                    {isStripeLoading ? "..." : "Déconnecter"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleStripeConnect}
                  disabled={isStripeLoading || !session?.user?.id}
                  size="sm"
                  className="bg-[#635BFF] hover:bg-[#5A54E5] text-white flex-1 disabled:opacity-50"
                >
                  {isStripeLoading ? "Connexion..." : "Connecter Stripe"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connexion bancaire Bridge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carte de connexion Bridge */}
        <Card className="border-0 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              Connexion bancaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                      Bridge API
                    </p>
                    {bridgeConnected && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-normal">
                          Connecté
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bridgeConnected
                      ? "Votre compte bancaire est connecté et synchronisé"
                      : "Aucun compte bancaire connecté"}
                  </p>
                  {bridgeUserId && (
                    <p className="text-xs text-muted-foreground">
                      ID Bridge: {bridgeUserId}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {bridgeConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBridgeDisconnect}
                    disabled={bridgeDisconnecting || bridgeLoading}
                  >
                    {bridgeDisconnecting ? "Déconnexion..." : "Déconnecter"}
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Utilisez le bouton sur le tableau de bord principal pour
                    connecter un compte bancaire
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des comptes bancaires */}
        <Card className="border-0 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              Comptes bancaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {bridgeAccountsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-muted-foreground">
                  Chargement...
                </span>
              </div>
            ) : bridgeAccountsError ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">
                  Erreur lors du chargement des comptes
                </span>
              </div>
            ) : !bridgeConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                      Aucun compte connecté
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Connectez un compte bancaire pour voir vos comptes ici
                    </p>
                  </div>
                </div>
              </div>
            ) : bridgeAccounts.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                      Aucun compte trouvé
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vos comptes apparaîtront ici après synchronisation
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                      {bridgeAccounts.length} compte{bridgeAccounts.length > 1 ? 's' : ''} synchronisé{bridgeAccounts.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-normal">
                        Actif
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comptes bancaires connectés via Bridge API
                  </p>
                </div>
                
                <div className="max-h-32 overflow-y-auto pr-2 -mr-2 space-y-2">
                  {bridgeAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {account.name.length > 15 ? `${account.name.slice(0, 15)}...` : account.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{account.bank.name}</span>
                            <span>•</span>
                            <span className="uppercase tracking-wide">
                              {account.type === "checking" ? "Courant" : 
                               account.type === "savings" ? "Épargne" :
                               account.type === "loan" ? "Crédit" : account.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-medium ${
                            account.balance >= 0
                              ? "text-gray-900"
                              : "text-red-600"
                          }`}
                        >
                          {account.balance.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: account.currency,
                          })}
                        </p>
                        {account.iban && (
                          <p className="text-xs text-muted-foreground font-mono">
                            •••• {account.iban.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Authentification */}
      <Card className="border-0 shadow-sm backdrop-blur-sm">
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
      </Card>
    </div>
  );
}
