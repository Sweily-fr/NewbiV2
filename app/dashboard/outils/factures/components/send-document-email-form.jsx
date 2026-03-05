"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";

const DOCUMENT_LABELS = {
  invoice: { singular: "facture", article: "la" },
  quote: { singular: "devis", article: "le" },
  creditNote: { singular: "avoir", article: "l'" },
  purchaseOrder: { singular: "bon de commande", article: "le" },
};

export default function SendDocumentEmailForm({
  documentType = "invoice",
  clientEmail,
  clientName,
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const useCustomFooter = watch("useCustomFooter");
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;

  return (
    <div className="space-y-4">
      {/* Destinataire */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-full bg-[#5b50ff]/10 shrink-0">
          <span className="text-xs font-medium text-[#5b50ff]">
            {(clientName || "?").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {clientName || "Client non défini"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {clientEmail || "Email non défini"}
          </p>
        </div>
      </div>

      <div className="border-t border-border/40" />

      {/* Configuration de l'email */}
      <div className="space-y-3">
        {/* Variables disponibles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Variables :</span>
          {[
            "{clientName}",
            "{documentNumber}",
            "{totalAmount}",
            "{companyName}",
            ...(documentType === "creditNote" ? ["{invoiceNumber}"] : []),
          ].map((v) => (
            <code
              key={v}
              className="px-1.5 py-0.5 text-[11px] rounded-md bg-muted/60 text-muted-foreground border border-border/40 font-mono"
            >
              {v}
            </code>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="emailSubject" className="text-sm text-muted-foreground">
            Objet de l&apos;email
          </label>
          <Input
            id="emailSubject"
            {...register("emailSubject", { required: "L'objet est requis" })}
            placeholder={`${documentType === "invoice" ? "Facture" : documentType === "quote" ? "Devis" : documentType === "purchaseOrder" ? "Bon de commande" : "Avoir"} {documentNumber}`}
          />
          {errors.emailSubject && (
            <p className="text-sm text-red-500">
              {errors.emailSubject.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="emailBody" className="text-sm text-muted-foreground">
            Corps du message
          </label>
          <textarea
            id="emailBody"
            {...register("emailBody", { required: "Le message est requis" })}
            placeholder="Bonjour {clientName},&#10;&#10;Veuillez trouver ci-joint..."
            rows={10}
            className="flex w-full rounded-[9px] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-2.5 py-2 text-sm font-medium text-[#242529] dark:text-white placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] transition-[border] duration-[80ms] ease-in-out outline-none resize-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.emailBody && (
            <p className="text-sm text-red-500">{errors.emailBody.message}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border/40" />

      {/* Personnalisation du bas de l'email */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-normal mb-1">
              Personnaliser le bas de l&apos;email
            </h4>
            <p className="text-xs text-gray-400">
              Remplacez le message par défaut en bas de l&apos;email
            </p>
          </div>
          <Switch
            checked={useCustomFooter || false}
            onCheckedChange={(checked) => setValue("useCustomFooter", checked)}
            className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
          />
        </div>

        {useCustomFooter && (
          <div className="space-y-2">
            <label htmlFor="customEmailFooter" className="text-sm text-muted-foreground">
              Message personnalisé
            </label>
            <textarea
              id="customEmailFooter"
              {...register("customEmailFooter")}
              placeholder="Ex: Ce document a été généré par notre société. Pour toute question, contactez-nous à contact@exemple.fr"
              rows={3}
              className="flex w-full rounded-[9px] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] bg-transparent px-2.5 py-2 text-sm font-medium text-[#242529] dark:text-white placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] transition-[border] duration-[80ms] ease-in-out outline-none resize-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles : {"{companyName}"}, {"{clientName}"}, {"{documentNumber}"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
