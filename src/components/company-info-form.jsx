"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "@/src/components/ui/sonner";
import { CompanyRegistrySearch } from "@/src/components/settings/company-registry-search";
import { useSession } from "@/src/lib/auth-client";
import {
  companyFieldsFromRegistry,
  describeRegistryFill,
  normalizeLegalForm,
} from "@/src/lib/company-registry";
import { LEGAL_FORM_GROUPS } from "@/src/lib/legal-forms";
import { updateOrganization } from "@/src/lib/organization-client";
import { documentLegalRequirements } from "@/src/hooks/useCompanyInfoGuard";
import {
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
  sanitizeInput,
} from "@/src/lib/validation";
import { cn } from "@/src/lib/utils";

const noInjection = (value) =>
  !value ||
  !detectInjectionAttempt(value) ||
  "Caractères non autorisés détectés";

function Field({ label, htmlFor, error, className, children }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-black/55 dark:text-white/55"
      >
        {label} <span className="text-red-500">*</span>
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

const valuesFromOrganization = (organization, fallbackEmail) => ({
  companyName: organization?.companyName || "",
  // Souvent la même adresse que celle du compte : pré-remplie, modifiable.
  companyEmail: organization?.companyEmail || fallbackEmail || "",
  addressStreet: organization?.addressStreet || "",
  addressZipCode: organization?.addressZipCode || "",
  addressCity: organization?.addressCity || "",
  legalForm:
    organization?.legalForm === "Auto-entrepreneur"
      ? "EI"
      : normalizeLegalForm(organization?.legalForm),
  siret: organization?.siret || "",
  rcs: organization?.rcs || "",
  capitalSocial: organization?.capitalSocial || "",
});

/**
 * Formulaire de la fenêtre « Configuration de votre entreprise » : tous les
 * champs exigés pour générer un document, avec la recherche au registre, sans
 * passer par les paramètres. Le SIRET est revérifié par le serveur à
 * l'enregistrement (organization-siret-guard).
 */
export function CompanyInfoForm({ organization, onCancel, onSaved }) {
  const { data: session } = useSession();
  const [registryNotice, setRegistryNotice] = useState(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: valuesFromOrganization(organization, session?.user?.email),
  });

  const required = documentLegalRequirements(watch("legalForm"));

  const handleRegistryCompanySelect = async (company) => {
    setRegistryNotice(null);
    const fields = companyFieldsFromRegistry(company);
    if (!fields.siret) {
      setRegistryNotice({
        type: "error",
        text: "Cette entreprise n'a pas de numéro SIRET valide.",
      });
      return;
    }

    setIsCheckingCompany(true);
    try {
      const res = await fetch(`/api/check-siret?siret=${fields.siret}`);
      const data = await res.json();
      if (data.available === false) {
        setRegistryNotice({
          type: "error",
          text: `${data.message} Demandez une invitation à son administrateur.`,
        });
        return;
      }
    } catch {
      // Contrôle de confort : le serveur refait la vérification.
    } finally {
      setIsCheckingCompany(false);
    }

    const options = { shouldDirty: true, shouldValidate: true };
    setValue("siret", fields.siret, options);
    if (fields.legalForm) setValue("legalForm", fields.legalForm, options);
    if (fields.companyName)
      setValue("companyName", fields.companyName, options);
    if (fields.addressStreet) {
      setValue("addressStreet", fields.addressStreet, options);
    }
    if (fields.addressZipCode) {
      setValue("addressZipCode", fields.addressZipCode, options);
    }
    if (fields.addressCity)
      setValue("addressCity", fields.addressCity, options);
    setRegistryNotice({
      type: "success",
      text: describeRegistryFill(fields, "ci-dessous"),
    });
  };

  const onSubmit = async (values) => {
    setServerError(null);
    const siret = sanitizeInput(values.siret).replace(/\s/g, "");
    const companyName = sanitizeInput(values.companyName);
    const payload = {
      // Le nom de l'espace suit la raison sociale, comme dans les paramètres.
      name: companyName,
      companyName,
      companyEmail: sanitizeInput(values.companyEmail),
      addressStreet: sanitizeInput(values.addressStreet),
      addressZipCode: sanitizeInput(values.addressZipCode),
      addressCity: sanitizeInput(values.addressCity),
      addressCountry: organization?.addressCountry || "France",
      legalForm: values.legalForm,
      siret,
      siren: siret.slice(0, 9),
      ...(required.rcs && { rcs: sanitizeInput(values.rcs) }),
      ...(required.capital && {
        capitalSocial: sanitizeInput(values.capitalSocial),
      }),
    };

    try {
      await updateOrganization(organization.id, payload, {
        onError: (error) => {
          // SIRET refusé par le serveur (introuvable, fermé, déjà utilisé) :
          // le message dit quoi corriger.
          setServerError(
            error?.code === "SIRET_REJECTED"
              ? error.message
              : "L'enregistrement a échoué, veuillez réessayer.",
          );
        },
      });
    } catch {
      return;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("organizationUpdated", {
          detail: { organizationId: organization.id, ...payload },
        }),
      );
    }
    toast.success("Informations de l'entreprise enregistrées");
    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="max-h-[min(62vh,560px)] overflow-y-auto px-5 pt-4 pb-2 space-y-4">
        <p className="text-[13px] text-muted-foreground">
          Ces informations figurent sur vos documents.
        </p>

        {/* Recherche au registre */}
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="company-registry-search"
            className="text-xs font-medium text-black/55 dark:text-white/55"
          >
            Rechercher votre entreprise
          </Label>
          <CompanyRegistrySearch
            onSelect={handleRegistryCompanySelect}
            disabled={isCheckingCompany || isSubmitting}
          />
          {isCheckingCompany && (
            <p className="text-xs text-muted-foreground">
              Vérification de l'entreprise...
            </p>
          )}
          {registryNotice && (
            <p
              className={cn(
                "text-xs",
                registryNotice.type === "error"
                  ? "text-red-500"
                  : "text-muted-foreground",
              )}
            >
              {registryNotice.text}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Raison sociale"
            htmlFor="ci-companyName"
            error={errors.companyName}
          >
            <Input
              id="ci-companyName"
              {...register("companyName", {
                required: "La raison sociale est requise",
                pattern: VALIDATION_PATTERNS.companyName,
                validate: noInjection,
              })}
            />
          </Field>
          <Field
            label="E-mail de contact"
            htmlFor="ci-companyEmail"
            error={errors.companyEmail}
          >
            <Input
              id="ci-companyEmail"
              type="email"
              {...register("companyEmail", {
                required: "L'e-mail de contact est requis",
                pattern: VALIDATION_PATTERNS.email,
                validate: noInjection,
              })}
            />
          </Field>
          <Field
            label="Adresse"
            htmlFor="ci-addressStreet"
            error={errors.addressStreet}
            className="sm:col-span-2"
          >
            <Input
              id="ci-addressStreet"
              placeholder="12 rue de la Paix"
              {...register("addressStreet", {
                required: "L'adresse est requise",
                pattern: VALIDATION_PATTERNS.street,
                validate: noInjection,
              })}
            />
          </Field>
          <Field
            label="Code postal"
            htmlFor="ci-addressZipCode"
            error={errors.addressZipCode}
          >
            <Input
              id="ci-addressZipCode"
              inputMode="numeric"
              placeholder="75002"
              {...register("addressZipCode", {
                required: "Le code postal est requis",
                pattern: VALIDATION_PATTERNS.postalCode,
              })}
            />
          </Field>
          <Field
            label="Ville"
            htmlFor="ci-addressCity"
            error={errors.addressCity}
          >
            <Input
              id="ci-addressCity"
              placeholder="Paris"
              {...register("addressCity", {
                required: "La ville est requise",
                pattern: VALIDATION_PATTERNS.city,
                validate: noInjection,
              })}
            />
          </Field>
          <Field
            label="Forme juridique"
            htmlFor="ci-legalForm"
            error={errors.legalForm}
          >
            <Controller
              name="legalForm"
              control={control}
              rules={{ required: "La forme juridique est requise" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="ci-legalForm" className="w-full">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent
                    collisionPadding={{ top: 16, bottom: 32 }}
                    className="max-h-[min(360px,var(--radix-select-content-available-height))]"
                  >
                    {LEGAL_FORM_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.forms.map((form) => (
                          <SelectItem key={form.value} value={form.value}>
                            {form.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Numéro SIRET" htmlFor="ci-siret" error={errors.siret}>
            <Input
              id="ci-siret"
              inputMode="numeric"
              placeholder="12345678901234"
              {...register("siret", {
                required: "Le numéro SIRET est requis",
                setValueAs: (value) => String(value || "").replace(/\s/g, ""),
                pattern: VALIDATION_PATTERNS.siret,
              })}
            />
          </Field>
          {required.rcs && (
            <Field label="Numéro RCS" htmlFor="ci-rcs" error={errors.rcs}>
              <Input
                id="ci-rcs"
                placeholder="RCS Paris 123 456 789"
                {...register("rcs", {
                  required:
                    "Le numéro RCS est requis pour cette forme juridique",
                  pattern: VALIDATION_PATTERNS.rcs,
                  validate: noInjection,
                })}
              />
            </Field>
          )}
          {required.capital && (
            <Field
              label="Capital social (€)"
              htmlFor="ci-capitalSocial"
              error={errors.capitalSocial}
            >
              <Input
                id="ci-capitalSocial"
                inputMode="decimal"
                placeholder="1000"
                {...register("capitalSocial", {
                  required:
                    "Le capital social est requis pour cette forme juridique",
                  pattern: VALIDATION_PATTERNS.capital,
                })}
              />
            </Field>
          )}
        </div>

        {serverError && (
          <p className="text-[13px] text-red-500" role="alert">
            {serverError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-5 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Retour
        </button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isCheckingCompany}
          className="cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Enregistrer et continuer"
          )}
        </Button>
      </div>
    </form>
  );
}
