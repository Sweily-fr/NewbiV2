"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { X, Plus } from "lucide-react";

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
  const ccEmails = watch("ccEmails") || [];
  const bccEmails = watch("bccEmails") || [];
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const labels = DOCUMENT_LABELS[documentType] || DOCUMENT_LABELS.invoice;

  const [ccError, setCcError] = useState("");
  const [bccError, setBccError] = useState("");

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addEmail = (type, input, setInput, setError) => {
    const email = input.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setError("Adresse email invalide");
      return;
    }
    const current = type === "cc" ? ccEmails : bccEmails;
    if (current.includes(email)) {
      setError("Cette adresse est déjà ajoutée");
      return;
    }
    if (email === clientEmail) {
      setError("Cette adresse est déjà le destinataire principal");
      return;
    }
    setError("");
    setValue(type === "cc" ? "ccEmails" : "bccEmails", [...current, email]);
    setInput("");
  };

  const removeEmail = (type, email) => {
    const field = type === "cc" ? "ccEmails" : "bccEmails";
    const current = type === "cc" ? ccEmails : bccEmails;
    setValue(field, current.filter((e) => e !== email));
  };

  const handleEmailKeyDown = (e, type, input, setInput, setError) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(type, input, setInput, setError);
    }
    if (e.key === "Backspace" && !input) {
      const current = type === "cc" ? ccEmails : bccEmails;
      if (current.length > 0) {
        removeEmail(type, current[current.length - 1]);
      }
    }
  };

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

      {/* CC / BCC toggles */}
      {!showCc && !showBcc && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCc(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + Cc
          </button>
          <button
            type="button"
            onClick={() => setShowBcc(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + Cci
          </button>
        </div>
      )}

      {/* CC Field */}
      {showCc && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Cc (copie)</label>
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                + Cci
              </button>
            )}
          </div>
          {ccEmails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ccEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#5b50ff]/10 text-[#5b50ff] text-xs font-medium"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail("cc", email)}
                    className="hover:text-[#5b50ff]/70"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={`flex items-center gap-1.5 min-h-[36px] rounded-[9px] border ${ccError ? "border-red-400 dark:border-red-500" : "border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"} px-2 py-1.5 transition-[border] duration-[80ms] focus-within:border-[#5b50ff] dark:focus-within:border-[#5b50ff]`}>
            <input
              type="email"
              value={ccInput}
              onChange={(e) => {
                setCcInput(e.target.value);
                if (ccError) setCcError("");
              }}
              onKeyDown={(e) => handleEmailKeyDown(e, "cc", ccInput, setCcInput, setCcError)}
              placeholder="email@exemple.com"
              className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)]"
            />
            <button
              type="button"
              onClick={() => addEmail("cc", ccInput, setCcInput, setCcError)}
              disabled={!ccInput.trim()}
              className="shrink-0 flex items-center justify-center size-6 rounded-md bg-[#5b50ff] text-white hover:bg-[#4a41e0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Ajouter"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {ccError && (
            <p className="text-[11px] text-red-500">{ccError}</p>
          )}
          {!ccError && ccEmails.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Tapez un email puis appuyez sur Entrée ou cliquez sur +
            </p>
          )}
        </div>
      )}

      {/* BCC Field */}
      {showBcc && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Cci (copie cachée)</label>
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                + Cc
              </button>
            )}
          </div>
          {bccEmails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bccEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail("bcc", email)}
                    className="hover:opacity-70"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={`flex items-center gap-1.5 min-h-[36px] rounded-[9px] border ${bccError ? "border-red-400 dark:border-red-500" : "border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A]"} px-2 py-1.5 transition-[border] duration-[80ms] focus-within:border-[#5b50ff] dark:focus-within:border-[#5b50ff]`}>
            <input
              type="email"
              value={bccInput}
              onChange={(e) => {
                setBccInput(e.target.value);
                if (bccError) setBccError("");
              }}
              onKeyDown={(e) => handleEmailKeyDown(e, "bcc", bccInput, setBccInput, setBccError)}
              placeholder="email@exemple.com"
              className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-[rgba(0,0,0,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)]"
            />
            <button
              type="button"
              onClick={() => addEmail("bcc", bccInput, setBccInput, setBccError)}
              disabled={!bccInput.trim()}
              className="shrink-0 flex items-center justify-center size-6 rounded-md bg-[#5b50ff] text-white hover:bg-[#4a41e0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Ajouter"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {bccError && (
            <p className="text-[11px] text-red-500">{bccError}</p>
          )}
          {!bccError && bccEmails.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Tapez un email puis appuyez sur Entrée ou cliquez sur +
            </p>
          )}
        </div>
      )}

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
