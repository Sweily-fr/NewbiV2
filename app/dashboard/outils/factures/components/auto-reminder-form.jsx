"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";

export default function AutoReminderForm({ isSmtpConfigured = true }) {
  const { register, watch, setValue } = useFormContext();
  
  const enabled = watch("enabled");
  const useCustomSender = watch("useCustomSender");

  return (
    <div className="space-y-6">
      {/* Activation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-base font-medium">
              Activer les relances automatiques
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSmtpConfigured 
                ? "Les emails de relance seront envoyés automatiquement"
                : "Configuration SMTP requise pour activer les relances"}
            </p>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={(checked) => setValue("enabled", checked)}
            disabled={!isSmtpConfigured}
            className="data-[state=checked]:bg-[#5b50ff]"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-0" />

      {/* Configuration des délais */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-2">Délais de relance</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Définissez le nombre de jours après la date d'échéance pour envoyer les relances
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstReminderDays">
              Première relance (jours)
            </Label>
            <Input
              id="firstReminderDays"
              type="number"
              min="0"
              {...register("firstReminderDays", { valueAsNumber: true })}
              disabled={!enabled}
            />
            <p className="text-xs text-muted-foreground">
              0 = le jour de l'échéance
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondReminderDays">
              Deuxième relance (jours)
            </Label>
            <Input
              id="secondReminderDays"
              type="number"
              min="0"
              {...register("secondReminderDays", { valueAsNumber: true })}
              disabled={!enabled}
            />
            <p className="text-xs text-muted-foreground">
              Ex: 7 jours après échéance
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Heure d'envoi des relances
          </Label>
          <div className="flex items-center gap-2 w-24">
            <Input
              type="number"
              min="0"
              max="23"
              value={watch("reminderHour") ?? 9}
              onChange={(e) => {
                const hour = parseInt(e.target.value, 10);
                if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                  setValue("reminderHour", hour);
                }
              }}
              disabled={!enabled}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">h00</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Heure à laquelle les relances seront envoyées (fuseau horaire Paris)
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-0" />

      {/* Configuration de l'email expéditeur */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-2">Email expéditeur</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Configurez l'email qui apparaîtra comme expéditeur des relances
          </p>
        </div>

        {/* Info box */}
        <div className="p-3 bg-[#5b50ff]/10 border border-[#5b50ff]/20 rounded-lg">
          <p className="text-xs text-[#5b50ff]">
            Nous utilisons notre serveur d'envoi pour garantir la délivrabilité. 
            Vos emails seront envoyés avec votre adresse.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromEmail">
            Email expéditeur <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fromEmail"
            type="email"
            placeholder="facturation@mon-entreprise.fr"
            {...register("fromEmail", { required: enabled })}
            disabled={!enabled}
          />
          <p className="text-xs text-muted-foreground">
            Cet email apparaîtra comme expéditeur des relances
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromName">
            Nom de l'expéditeur (optionnel)
          </Label>
          <Input
            id="fromName"
            placeholder="Mon Entreprise"
            {...register("fromName")}
            disabled={!enabled}
          />
          <p className="text-xs text-muted-foreground">
            Le nom qui apparaîtra à côté de l'email
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="replyTo">
            Email de réponse (optionnel)
          </Label>
          <Input
            id="replyTo"
            type="email"
            placeholder="contact@mon-entreprise.fr"
            {...register("replyTo")}
            disabled={!enabled}
          />
          <p className="text-xs text-muted-foreground">
            Les réponses seront envoyées à cet email
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-0" />

      {/* Configuration du contenu de l'email */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-2">Contenu de l'email</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Variables disponibles: {"{invoiceNumber}"}, {"{clientName}"}, {"{totalAmount}"}, {"{dueDate}"}, {"{companyName}"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailSubject">Objet de l'email</Label>
          <Input
            id="emailSubject"
            placeholder="Rappel de paiement - Facture {invoiceNumber}"
            {...register("emailSubject")}
            disabled={!enabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailBody">Corps de l'email</Label>
          <Textarea
            id="emailBody"
            rows={12}
            placeholder="Bonjour {clientName},&#10;&#10;Nous vous rappelons que la facture {invoiceNumber}..."
            {...register("emailBody")}
            disabled={!enabled}
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
