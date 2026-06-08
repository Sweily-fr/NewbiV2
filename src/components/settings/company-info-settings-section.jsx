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
import { useFormContext } from "react-hook-form";
import {
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";

const COUNTRIES = [
  { value: "France", label: "France", flag: "🇫🇷" },
  { value: "Belgique", label: "Belgique", flag: "🇧🇪" },
  { value: "Suisse", label: "Suisse", flag: "🇨🇭" },
  { value: "Canada", label: "Canada", flag: "🇨🇦" },
  { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺" },
];

export default function CompanyInfoSettingsSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const country = watch("addressCountry");

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
        <div className="space-y-4">
          {/* Nom de l'entreprise */}
          <div className="space-y-1.5">
            <Label
              htmlFor="company-name"
              className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
            >
              Nom de l'entreprise
            </Label>
            <Input
              id="company-name"
              {...register("companyName", {
                required: "Le nom est requis",
                pattern: {
                  value: VALIDATION_PATTERNS.companyName.pattern,
                  message: VALIDATION_PATTERNS.companyName.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
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
              <Label
                htmlFor="company-email"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
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
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
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
              <Label
                htmlFor="company-phone"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Téléphone
              </Label>
              <Input
                id="company-phone"
                {...register("companyPhone", {
                  pattern: {
                    value: VALIDATION_PATTERNS.phone.pattern,
                    message: VALIDATION_PATTERNS.phone.message,
                  },
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
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
            <Label
              htmlFor="company-website"
              className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
            >
              Site web
            </Label>
            <Input
              id="company-website"
              {...register("website", {
                pattern: {
                  value: VALIDATION_PATTERNS.website.pattern,
                  message: VALIDATION_PATTERNS.website.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
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
            <Label
              htmlFor="company-street"
              className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
            >
              Adresse
            </Label>
            <Input
              id="company-street"
              {...register("addressStreet", {
                pattern: {
                  value: VALIDATION_PATTERNS.street.pattern,
                  message: VALIDATION_PATTERNS.street.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
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
              <Label
                htmlFor="company-city"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Ville
              </Label>
              <Input
                id="company-city"
                {...register("addressCity", {
                  pattern: {
                    value: VALIDATION_PATTERNS.city.pattern,
                    message: VALIDATION_PATTERNS.city.message,
                  },
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
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
              <Label
                htmlFor="company-postalCode"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Code postal
              </Label>
              <Input
                id="company-postalCode"
                {...register("addressZipCode", {
                  pattern: {
                    value: VALIDATION_PATTERNS.postalCode.pattern,
                    message: VALIDATION_PATTERNS.postalCode.message,
                  },
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
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
              <Label
                htmlFor="company-country"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
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
        </div>
      </CardContent>
    </Card>
  );
}
