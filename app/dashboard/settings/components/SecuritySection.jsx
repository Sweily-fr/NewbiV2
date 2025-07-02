import React, { useState } from "react";
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
  Settings
} from "lucide-react";

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

  const handleOAuthConnect = (provider) => {
    // Ici vous implémenteriez la logique de connexion OAuth
    setOauthConnections(prev => ({
      ...prev,
      [provider]: !prev[provider]
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

  return (
    <div className="space-y-6">
      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mot de passe
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Changer le mot de passe</h4>
              <p className="text-sm text-muted-foreground">
                Dernière modification il y a 3 mois
              </p>
            </div>
            <Button variant="outline">
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentification à deux facteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification à deux facteurs
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-4">
          {/* OAuth Providers */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Connexions OAuth</h4>
              <p className="text-sm text-muted-foreground">
                Connectez vos comptes sociaux pour une connexion rapide
              </p>
            </div>
            <Dialog open={isOAuthDialogOpen} onOpenChange={setIsOAuthDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Configuration OAuth</DialogTitle>
                  <DialogDescription>
                    Connectez ou déconnectez vos comptes sociaux
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* GitHub */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Github className="h-5 w-5" />
                      <div>
                        <p className="font-medium">GitHub</p>
                        <p className="text-sm text-muted-foreground">
                          Connectez votre compte GitHub
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {oauthConnections.github ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connecté
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Non connecté
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant={oauthConnections.github ? "destructive" : "default"}
                        onClick={() => handleOAuthConnect("github")}
                      >
                        {oauthConnections.github ? "Déconnecter" : "Connecter"}
                      </Button>
                    </div>
                  </div>

                  {/* Google */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">
                          Connectez votre compte Google
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {oauthConnections.google ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connecté
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Non connecté
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant={oauthConnections.google ? "destructive" : "default"}
                        onClick={() => handleOAuthConnect("google")}
                      >
                        {oauthConnections.google ? "Déconnecter" : "Connecter"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Numéro de téléphone de récupération */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Numéro de téléphone de récupération</h4>
              <p className="text-sm text-muted-foreground">
                Utilisé pour la récupération de compte
              </p>
            </div>
            <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Numéro de téléphone de récupération</DialogTitle>
                  <DialogDescription>
                    Ajoutez un numéro de téléphone pour sécuriser votre compte
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <Input
                      id="phone"
                      placeholder="+33 6 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleSendVerificationCode}
                    >
                      Envoyer le code
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Code de vérification</Label>
                    <Input
                      id="verification-code"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={handlePhoneVerification}
                    >
                      Vérifier
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleSendVerificationCode}
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

      {/* Sessions actives */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions actives</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Session actuelle</p>
                <p className="text-sm text-muted-foreground">
                  Chrome sur macOS • Paris, France
                </p>
              </div>
              <Badge variant="success">Actuelle</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">iPhone Safari</p>
                <p className="text-sm text-muted-foreground">
                  Il y a 2 heures • Paris, France
                </p>
              </div>
              <Button variant="outline" size="sm">
                Révoquer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
