"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Info } from "lucide-react";

const DOCUMENT_LABELS = {
  invoice: { singular: "facture", article: "la" },
  quote: { singular: "devis", article: "le" },
  creditNote: { singular: "avoir", article: "l'" },
};

export default function SendDocumentEmailForm({ 
  documentType = "invoice",
  clientEmail,
  clientName,
}) {
  const { register, formState: { errors } } = useFormContext();
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;

  return (
    <div className="space-y-6">
      {/* Info destinataire */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-2">Destinataire</h3>
          <p className="text-sm text-muted-foreground mb-3">
            L&apos;email sera envoyé au client sélectionné dans {labels.article}{labels.singular}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Client</Label>
          <div className="p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-medium text-foreground">{clientName || "Client non défini"}</p>
            <p className="text-sm text-muted-foreground">{clientEmail || "Email non défini"}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Configuration de l'email */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-2">Contenu de l&apos;email</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Personnalisez le message qui accompagnera {labels.article}{labels.singular}
          </p>
        </div>

        {/* Info box variables */}
        <div className="p-3 bg-[#5b50ff]/10 border border-[#5b50ff]/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-[#5b50ff] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#5b50ff]">
              Variables disponibles : {"{clientName}"}, {"{documentNumber}"}, {"{totalAmount}"}, {"{companyName}"}
              {documentType === "creditNote" && <>, {"{invoiceNumber}"}</>}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailSubject">
            Objet de l&apos;email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="emailSubject"
            {...register("emailSubject", { required: "L'objet est requis" })}
            placeholder={`${documentType === "invoice" ? "Facture" : documentType === "quote" ? "Devis" : "Avoir"} {documentNumber}`}
            className="dark:border-gray-700"
          />
          {errors.emailSubject && (
            <p className="text-sm text-red-500">{errors.emailSubject.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailBody">
            Corps du message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="emailBody"
            {...register("emailBody", { required: "Le message est requis" })}
            placeholder="Bonjour {clientName},&#10;&#10;Veuillez trouver ci-joint..."
            rows={10}
            className="dark:border-gray-700 resize-none"
          />
          {errors.emailBody && (
            <p className="text-sm text-red-500">{errors.emailBody.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
