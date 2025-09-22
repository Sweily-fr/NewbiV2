import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import {
  Input,
  InputEmail,
  InputPhone,
  InputEndAddOn,
} from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Building, Mail, Phone, Globe, FileText, MapPin } from "lucide-react";
import {
  VALIDATION_PATTERNS,
  sanitizeInput,
  detectInjectionAttempt,
} from "@/src/lib/validation";

const COUNTRIES = [
  { value: "France", label: "France" },
  { value: "Belgique", label: "Belgique" },
  { value: "Suisse", label: "Suisse" },
  { value: "Canada", label: "Canada" },
  { value: "Luxembourg", label: "Luxembourg" },
];

export default function CompanySection({
  register,
  errors,
  watch,
  setValue,
  session,
}) {
  const [logoUrl, setLogoUrl] = React.useState(watch("logo") || null);
  const selectedCountry = watch("address.country");

  const handleLogoChange = (imageUrl) => {
    setLogoUrl(imageUrl);
    setValue("logo", imageUrl);
  };

  // Synchroniser avec la valeur du formulaire
  useEffect(() => {
    const currentLogo = watch("logo");
    if (currentLogo !== logoUrl) {
      setLogoUrl(currentLogo);
    }
  }, [watch("logo")]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none backdrop-blur-sm pt-2">
        {/* <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-medium">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            Informations générales
          </CardTitle>
        </CardHeader> */}
        <CardContent className="space-y-6">
          {/* Logo de l'entreprise */}
          <div className="flex items-start gap-4 p-4 bg-gray-100/80 dark:bg-[#000] rounded-xl">
            <CompanyLogoUpload
              currentImageUrl={logoUrl}
              onImageChange={handleLogoChange}
              showDescription={false}
            />
            <div className="flex-1">
              <Label className="text-sm font-normal">
                Logo de l'entreprise
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Glissez une image ou cliquez pour uploader le logo de votre
                entreprise. Formats acceptés : JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>

          {/* Nom de l'entreprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="flex items-center gap-2 font-normal"
              >
                <Building className="h-4 w-4 text-gray-500" />
                Nom de l'entreprise *
              </Label>
              <Input
                id="name"
                placeholder="Nom de votre entreprise"
                {...register("name", {
                  required: "Le nom est requis",
                  pattern: {
                    value: VALIDATION_PATTERNS.companyName.pattern,
                    message: VALIDATION_PATTERNS.companyName.message,
                  },
                  validate: (value) => {
                    if (detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 font-normal"
              >
                <Mail className="h-4 w-4 text-gray-500" />
                Email professionnel *
              </Label>
              <InputEmail
                id="email"
                type="email"
                placeholder="contact@entreprise.com"
                {...register("email", {
                  required: "L'email est requis",
                  pattern: {
                    value: VALIDATION_PATTERNS.email.pattern,
                    message: VALIDATION_PATTERNS.email.message,
                  },
                  validate: (value) => {
                    if (detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Téléphone et site web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="flex items-center gap-2 font-normal"
              >
                <Phone className="h-4 w-4 text-gray-500" />
                Téléphone
              </Label>
              <InputPhone
                id="phone"
                placeholder="+33 1 23 45 67 89"
                {...register("phone", {
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
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="flex items-center gap-2 font-normal"
              >
                <Globe className="h-4 w-4 text-gray-500" />
                Site web
              </Label>
              <InputEndAddOn
                id="website"
                placeholder="https://www.entreprise.com"
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
              />
            </div>
          </div>

          {/* Description */}
          {/* <div className="space-y-2">
            <Label
              htmlFor="description"
              className="flex items-center gap-2 font-normal"
            >
              <FileText className="h-4 w-4 text-gray-500" />
              Description de l'entreprise
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre entreprise..."
              rows={4}
              {...register("description", {
                pattern: {
                  value: VALIDATION_PATTERNS.description.pattern,
                  message: VALIDATION_PATTERNS.description.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                e.target.value = sanitized;
              }}
            />
          </div>

          {/* Séparateur */}
          <Separator className="my-6" />

          {/* Section Adresse */}
          <div className="space-y-4">
            {/* Adresse complète */}
            <div className="space-y-2">
              <Label className="font-normal" htmlFor="address.street">
                Adresse *
              </Label>
              <Input
                id="address.street"
                placeholder="123 Rue de la République"
                {...register("address.street", {
                  required: "L'adresse est requise",
                  pattern: {
                    value: VALIDATION_PATTERNS.street.pattern,
                    message: VALIDATION_PATTERNS.street.message,
                  },
                  validate: (value) => {
                    if (detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.address?.street && (
                <p className="text-sm text-red-500">
                  {errors.address.street.message}
                </p>
              )}
            </div>

            {/* Ville et code postal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-normal" htmlFor="address.city">
                  Ville *
                </Label>
                <Input
                  id="address.city"
                  placeholder="Paris"
                  {...register("address.city", {
                    required: "La ville est requise",
                    pattern: {
                      value: VALIDATION_PATTERNS.city.pattern,
                      message: VALIDATION_PATTERNS.city.message,
                    },
                    validate: (value) => {
                      if (detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                />
                {errors.address?.city && (
                  <p className="text-sm text-red-500">
                    {errors.address.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-normal" htmlFor="address.postalCode">
                  Code postal *
                </Label>
                <Input
                  id="address.postalCode"
                  placeholder="75001"
                  {...register("address.postalCode", {
                    required: "Le code postal est requis",
                    pattern: {
                      value: VALIDATION_PATTERNS.postalCode.pattern,
                      message: VALIDATION_PATTERNS.postalCode.message,
                    },
                    validate: (value) => {
                      if (detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                />
                {errors.address?.postalCode && (
                  <p className="text-sm text-red-500">
                    {errors.address.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label className="font-normal" htmlFor="address.country">
                Pays *
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => setValue("address.country", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.address?.country && (
                <p className="text-sm text-red-500">
                  {errors.address.country.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
