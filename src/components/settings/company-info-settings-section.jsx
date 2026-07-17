"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";
import { useFormContext } from "react-hook-form";
import {
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";
import {
  getActiveOrganization,
  updateOrganization,
} from "@/src/lib/organization-client";

const COUNTRIES = [
  { value: "France", label: "France", flag: "🇫🇷" },
  { value: "Belgique", label: "Belgique", flag: "🇧🇪" },
  { value: "Suisse", label: "Suisse", flag: "🇨🇭" },
  { value: "Canada", label: "Canada", flag: "🇨🇦" },
  { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺" },
];

const FIELD_LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

const noInjection = (value) => {
  if (value && detectInjectionAttempt(value)) {
    return "Caractères non autorisés détectés";
  }
  return true;
};

export default function CompanyInfoSettingsSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const country = watch("addressCountry");
  const showCommercialName = watch("showCommercialName");
  const isRegulatedActivity = watch("isRegulatedActivity");
  const logoUrl = watch("logo");

  // Le logo est sauvegardé immédiatement dans l'organisation (même comportement
  // que l'onglet Générale), en plus du formulaire pour la preview
  const handleLogoOrganizationUpdate = async (imageUrl) => {
    try {
      const org = await getActiveOrganization();
      if (org?.id) {
        await updateOrganization(org.id, { logo: imageUrl });
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde logo:", error);
    }
  };

  return (
    <Card className="shadow-none border-none bg-transparent p-0">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-medium text-lg">
            Informations de l'entreprise
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-6">
          {/* Logo de l'entreprise */}
          <div className="flex items-center gap-5">
            <CompanyLogoUpload
              currentImageUrl={logoUrl || null}
              onImageChange={(imageUrl) =>
                setValue("logo", imageUrl, { shouldDirty: true })
              }
              onOrganizationUpdate={handleLogoOrganizationUpdate}
              showDescription={false}
            />
            <div className="flex flex-col gap-1">
              <Label className={FIELD_LABEL_CLASS}>Logo de l'entreprise</Label>
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PNG, JPEG, WebP ou SVG (max 5MB)
              </p>
            </div>
          </div>

          {/* Dénomination sociale */}
          <div className="space-y-1.5">
            <Label htmlFor="company-name" className={FIELD_LABEL_CLASS}>
              Dénomination sociale
            </Label>
            <Input
              id="company-name"
              {...register("companyName", {
                required: "Le nom est requis",
                pattern: {
                  value: VALIDATION_PATTERNS.companyName.pattern,
                  message: VALIDATION_PATTERNS.companyName.message,
                },
                validate: noInjection,
              })}
              placeholder="Nom de votre entreprise"
              className={errors.companyName ? "border-destructive" : ""}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          {/* Email & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-email" className={FIELD_LABEL_CLASS}>
                Email professionnel
              </Label>
              <Input
                id="company-email"
                type="email"
                {...register("companyEmail", {
                  pattern: {
                    value: VALIDATION_PATTERNS.email.pattern,
                    message: VALIDATION_PATTERNS.email.message,
                  },
                  validate: noInjection,
                })}
                placeholder="contact@entreprise.fr"
                className={errors.companyEmail ? "border-destructive" : ""}
              />
              {errors.companyEmail && (
                <p className="text-xs text-destructive">
                  {errors.companyEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-phone" className={FIELD_LABEL_CLASS}>
                Téléphone
              </Label>
              <Input
                id="company-phone"
                {...register("companyPhone", {
                  pattern: {
                    value: VALIDATION_PATTERNS.phone.pattern,
                    message: VALIDATION_PATTERNS.phone.message,
                  },
                  validate: noInjection,
                })}
                placeholder="+33 6 12 34 56 78"
                className={errors.companyPhone ? "border-destructive" : ""}
              />
              {errors.companyPhone && (
                <p className="text-xs text-destructive">
                  {errors.companyPhone.message}
                </p>
              )}
            </div>
          </div>

          {/* Site web */}
          <div className="space-y-1.5">
            <Label htmlFor="company-website" className={FIELD_LABEL_CLASS}>
              Site web
            </Label>
            <Input
              id="company-website"
              {...register("website", {
                pattern: {
                  value: VALIDATION_PATTERNS.website.pattern,
                  message: VALIDATION_PATTERNS.website.message,
                },
                validate: noInjection,
              })}
              placeholder="https://www.entreprise.com"
              className={errors.website ? "border-destructive" : ""}
            />
            {errors.website && (
              <p className="text-xs text-destructive">
                {errors.website.message}
              </p>
            )}
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <Label htmlFor="company-street" className={FIELD_LABEL_CLASS}>
              Adresse
            </Label>
            <Input
              id="company-street"
              {...register("addressStreet", {
                pattern: {
                  value: VALIDATION_PATTERNS.street.pattern,
                  message: VALIDATION_PATTERNS.street.message,
                },
                validate: noInjection,
              })}
              placeholder="123 Rue de la République"
              className={errors.addressStreet ? "border-destructive" : ""}
            />
            {errors.addressStreet && (
              <p className="text-xs text-destructive">
                {errors.addressStreet.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-city" className={FIELD_LABEL_CLASS}>
                Ville
              </Label>
              <Input
                id="company-city"
                {...register("addressCity", {
                  pattern: {
                    value: VALIDATION_PATTERNS.city.pattern,
                    message: VALIDATION_PATTERNS.city.message,
                  },
                  validate: noInjection,
                })}
                placeholder="Paris"
                className={errors.addressCity ? "border-destructive" : ""}
              />
              {errors.addressCity && (
                <p className="text-xs text-destructive">
                  {errors.addressCity.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-postalCode" className={FIELD_LABEL_CLASS}>
                Code postal
              </Label>
              <Input
                id="company-postalCode"
                {...register("addressZipCode", {
                  pattern: {
                    value: VALIDATION_PATTERNS.postalCode.pattern,
                    message: VALIDATION_PATTERNS.postalCode.message,
                  },
                  validate: noInjection,
                })}
                placeholder="75001"
                className={errors.addressZipCode ? "border-destructive" : ""}
              />
              {errors.addressZipCode && (
                <p className="text-xs text-destructive">
                  {errors.addressZipCode.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-country" className={FIELD_LABEL_CLASS}>
                Pays
              </Label>
              <Select
                value={country || "France"}
                onValueChange={(value) =>
                  setValue("addressCountry", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="company-country">
                  <SelectValue placeholder="Sélectionner">
                    {(() => {
                      const selected = COUNTRIES.find(
                        (c) => c.value === (country || "France"),
                      );
                      return selected ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-base leading-none">
                            {selected.flag}
                          </span>
                          {selected.label}
                        </span>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-base leading-none">{c.flag}</span>
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nom commercial */}
          <div className="p-4 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label
                  htmlFor="show-commercial-name"
                  className="text-sm font-medium"
                >
                  Nom commercial
                </Label>
                <p className="text-xs text-muted-foreground">
                  Affiché sous la dénomination sociale sur vos devis, factures,
                  bons de commande et avoirs.
                </p>
              </div>
              <Switch
                id="show-commercial-name"
                checked={showCommercialName || false}
                onCheckedChange={(checked) => {
                  setValue("showCommercialName", checked, {
                    shouldDirty: true,
                  });
                }}
                className="shrink-0 data-[state=checked]:bg-[#5b4fff]"
              />
            </div>
            {showCommercialName && (
              <div className="space-y-1.5">
                <Input
                  id="company-commercial-name"
                  {...register("commercialName", {
                    validate: noInjection,
                  })}
                  placeholder="Nom commercial"
                  className={`bg-white dark:bg-neutral-800 ${
                    errors.commercialName ? "border-destructive" : ""
                  }`}
                />
                {errors.commercialName && (
                  <p className="text-xs text-destructive">
                    {errors.commercialName.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Activité réglementée */}
          <div className="p-4 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label
                  htmlFor="is-regulated-activity"
                  className="text-sm font-medium"
                >
                  Activité réglementée
                </Label>
                <p className="text-xs text-muted-foreground">
                  Titre professionnel dans les informations du document ;
                  organisme, numéro professionnel et assurances en bas de page.
                </p>
              </div>
              <Switch
                id="is-regulated-activity"
                checked={isRegulatedActivity || false}
                onCheckedChange={(checked) => {
                  setValue("isRegulatedActivity", checked, {
                    shouldDirty: true,
                  });
                }}
                className="shrink-0 data-[state=checked]:bg-[#5b4fff]"
              />
            </div>
            {isRegulatedActivity && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="regulated-professional-title"
                    className={FIELD_LABEL_CLASS}
                  >
                    Titre professionnel
                  </Label>
                  <Input
                    id="regulated-professional-title"
                    {...register("professionalTitle", {
                      validate: noInjection,
                    })}
                    placeholder="Ex : Expert-comptable"
                    className="bg-white dark:bg-neutral-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="regulated-regulatory-body"
                    className={FIELD_LABEL_CLASS}
                  >
                    Organisme de rattachement
                  </Label>
                  <Input
                    id="regulated-regulatory-body"
                    {...register("regulatoryBody", {
                      validate: noInjection,
                    })}
                    placeholder="Ex : Ordre des experts-comptables"
                    className="bg-white dark:bg-neutral-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="regulated-professional-number"
                    className={FIELD_LABEL_CLASS}
                  >
                    Numéro professionnel
                  </Label>
                  <Input
                    id="regulated-professional-number"
                    {...register("professionalNumber", {
                      validate: noInjection,
                    })}
                    placeholder="Ex : 12345678"
                    className="bg-white dark:bg-neutral-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="regulated-decennial-insurance"
                    className={FIELD_LABEL_CLASS}
                  >
                    Assurance décennale (si applicable)
                  </Label>
                  <Input
                    id="regulated-decennial-insurance"
                    {...register("decennialInsurance", {
                      validate: noInjection,
                    })}
                    placeholder="Ex : AXA, police n° 123456"
                    className="bg-white dark:bg-neutral-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="regulated-rc-pro-insurance"
                    className={FIELD_LABEL_CLASS}
                  >
                    Assurance RC Pro (si applicable)
                  </Label>
                  <Input
                    id="regulated-rc-pro-insurance"
                    {...register("professionalLiabilityInsurance", {
                      validate: noInjection,
                    })}
                    placeholder="Ex : MAAF, police n° 654321"
                    className="bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
