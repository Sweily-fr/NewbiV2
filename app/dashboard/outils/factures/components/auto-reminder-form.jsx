"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";

export default function AutoReminderForm({ isSmtpConfigured = true }) {
  const { register, watch, setValue } = useFormContext();

  const enabled = watch("enabled");

  return (
    <div className="space-y-4">
      {/* Activation */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-normal mb-1">
            Activer les relances automatiques
          </h4>
          <p className="text-xs text-muted-foreground">
            {isSmtpConfigured
              ? "Les emails de relance seront envoyés automatiquement"
              : "Configuration SMTP requise pour activer les relances"}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => setValue("enabled", checked)}
          disabled={!isSmtpConfigured}
          className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
        />
      </div>

      <div className="border-t border-border/40" />

      {/* Configuration des délais */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-normal mb-1">Délais de relance</h4>
          <p className="text-xs text-muted-foreground">
            Nombre de jours après la date d&apos;échéance
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">
              Première relance (jours)
            </label>
            <Input
              type="number"
              min="0"
              {...register("firstReminderDays", { valueAsNumber: true })}
              disabled={!enabled}
            />
            <p className="text-[11px] text-muted-foreground">
              0 = le jour de l&apos;échéance
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">
              Deuxième relance (jours)
            </label>
            <Input
              type="number"
              min="0"
              {...register("secondReminderDays", { valueAsNumber: true })}
              disabled={!enabled}
            />
            <p className="text-[11px] text-muted-foreground">
              Ex: 7 jours après échéance
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            Heure d&apos;envoi
          </label>
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
          <p className="text-[11px] text-muted-foreground">
            Fuseau horaire Paris
          </p>
        </div>
      </div>

      <div className="border-t border-border/40" />

      {/* Email expéditeur */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-normal mb-1">Email expéditeur</h4>
          <p className="text-xs text-muted-foreground">
            L&apos;email qui apparaîtra comme expéditeur des relances
          </p>
        </div>

        {/* Info box */}
        <div className="p-3 bg-[#5b50ff]/10 border border-[#5b50ff]/20 rounded-lg">
          <p className="text-xs text-[#5b50ff]">
            Nous utilisons notre serveur d&apos;envoi pour garantir la délivrabilité.
            Vos emails seront envoyés avec votre adresse.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            Email expéditeur
          </label>
          <Input
            type="email"
            placeholder="facturation@mon-entreprise.fr"
            {...register("fromEmail", { required: enabled })}
            disabled={!enabled}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            Nom de l&apos;expéditeur
          </label>
          <Input
            placeholder="Mon Entreprise"
            {...register("fromName")}
            disabled={!enabled}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            Email de réponse
          </label>
          <Input
            type="email"
            placeholder="contact@mon-entreprise.fr"
            {...register("replyTo")}
            disabled={!enabled}
          />
          <p className="text-[11px] text-muted-foreground">
            Les réponses seront envoyées à cet email
          </p>
        </div>
      </div>

      <div className="border-t border-border/40" />

      {/* Contenu de l'email */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-normal mb-1">Contenu de l&apos;email</h4>
        </div>

        {/* Variables disponibles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Variables :</span>
          {["{invoiceNumber}", "{clientName}", "{totalAmount}", "{dueDate}", "{companyName}"].map((v) => (
            <code
              key={v}
              className="px-1.5 py-0.5 text-[11px] rounded-md bg-muted/60 text-muted-foreground border border-border/40 font-mono"
            >
              {v}
            </code>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            Objet de l&apos;email
          </label>
          <Input
            placeholder="Rappel de paiement - Facture {invoiceNumber}"
            {...register("emailSubject")}
            disabled={!enabled}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            Corps du message
          </label>
          <textarea
            rows={10}
            placeholder={"Bonjour {clientName},\n\nNous vous rappelons que la facture {invoiceNumber}..."}
            {...register("emailBody")}
            disabled={!enabled}
            className="flex w-full rounded-[9px] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-2.5 py-2 text-sm font-medium text-[#242529] dark:text-white placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] transition-[border] duration-[80ms] ease-in-out outline-none resize-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
