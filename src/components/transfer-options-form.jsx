"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  IconClock,
  IconCreditCard,
  IconMail,
  IconShield,
} from "@tabler/icons-react";

const TransferOptionsForm = ({ options, onOptionsChange, className }) => {
  const handleChange = (field, value) => {
    onOptionsChange({
      ...options,
      [field]: value,
    });
  };

  const expirationOptions = [
    { value: "24h", label: "24 heures" },
    { value: "48h", label: "48 heures" },
    { value: "7d", label: "7 jours" },
    { value: "30d", label: "30 jours" },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Options d'expiration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <IconClock size={20} />
            <span>Durée de validité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration du lien</Label>
            <Select
              value={options.expiration}
              onValueChange={(value) => handleChange("expiration", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la durée" />
              </SelectTrigger>
              <SelectContent>
                {expirationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Options de paiement */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <IconCreditCard size={20} />
            <span>Paiement requis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="requirePayment">Activer le paiement</Label>
              <p className="text-sm text-muted-foreground">
                Les utilisateurs devront payer pour accéder aux fichiers
              </p>
            </div>
            <Switch
              id="requirePayment"
              checked={options.requirePayment}
              onCheckedChange={(checked) =>
                handleChange("requirePayment", checked)
              }
            />
          </div>

          {options.requirePayment && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Montant (€)</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={options.paymentAmount}
                    onChange={(e) =>
                      handleChange(
                        "paymentAmount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={options.currency}
                    onValueChange={(value) => handleChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDescription">
                  Description du paiement
                </Label>
                <Textarea
                  id="paymentDescription"
                  value={options.paymentDescription}
                  onChange={(e) =>
                    handleChange("paymentDescription", e.target.value)
                  }
                  placeholder="Décrivez ce pour quoi l'utilisateur paie..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options de notification */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <IconMail size={20} />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">
              Email du destinataire (optionnel)
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              value={options.recipientEmail}
              onChange={(e) => handleChange("recipientEmail", e.target.value)}
              placeholder="destinataire@exemple.com"
            />
            <p className="text-xs text-muted-foreground">
              Le destinataire recevra un email avec le lien de téléchargement
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifyOnDownload">
                Notification de téléchargement
              </Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un email quand les fichiers sont téléchargés
              </p>
            </div>
            <Switch
              id="notifyOnDownload"
              checked={options.notifyOnDownload}
              onCheckedChange={(checked) =>
                handleChange("notifyOnDownload", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Options de sécurité */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <IconShield size={20} />
            <span>Sécurité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="passwordProtected">
                Protection par mot de passe
              </Label>
              <p className="text-sm text-muted-foreground">
                Ajouter un mot de passe supplémentaire pour accéder aux fichiers
              </p>
            </div>
            <Switch
              id="passwordProtected"
              checked={options.passwordProtected}
              onCheckedChange={(checked) =>
                handleChange("passwordProtected", checked)
              }
            />
          </div>

          {options.passwordProtected && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={options.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Entrez un mot de passe"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxDownloads">
              Nombre maximum de téléchargements
            </Label>
            <Input
              id="maxDownloads"
              type="number"
              min="1"
              value={options.maxDownloads}
              onChange={(e) =>
                handleChange("maxDownloads", parseInt(e.target.value) || 1)
              }
              placeholder="Illimité"
            />
            <p className="text-xs text-muted-foreground">
              Laisser vide pour un nombre illimité de téléchargements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Message personnalisé */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Message personnalisé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="customMessage">Message pour le destinataire</Label>
            <Textarea
              id="customMessage"
              value={options.customMessage}
              onChange={(e) => handleChange("customMessage", e.target.value)}
              placeholder="Ajoutez un message personnalisé qui sera affiché au destinataire..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferOptionsForm;
