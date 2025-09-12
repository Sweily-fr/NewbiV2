import React, { useEffect } from "react";
import { useActiveOrganization } from "@/src/lib/organization-client";
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
import { Building, Mail, Phone, Globe, FileText } from "lucide-react";
import {
  VALIDATION_PATTERNS,
  sanitizeInput,
  detectInjectionAttempt,
} from "@/src/lib/validation";

export default function CompanySection({
  register,
  errors,
  watch,
  setValue,
  session,
  organization,
}) {
  const { refetch: refetchOrganization } = useActiveOrganization();
  const [logoUrl, setLogoUrl] = React.useState(watch("logo") || null);

  const handleLogoChange = (imageUrl) => {
    console.log("🔄 handleLogoChange appelé avec:", imageUrl);
    setLogoUrl(imageUrl);
    setValue("logo", imageUrl);
    
    // Forcer une mise à jour immédiate de l'affichage
    if (imageUrl) {
      console.log("✅ Logo mis à jour:", imageUrl);
    } else {
      console.log("🗑️ Logo supprimé - nettoyage UI");
    }
  };

  const handleOrganizationUpdate = React.useCallback(() => {
    // Refetch l'organisation après mise à jour du logo
    console.log("🔄 handleOrganizationUpdate appelé - refetch organisation");
    refetchOrganization().then((result) => {
      console.log("✅ Refetch organisation terminé:", result);
    }).catch((error) => {
      console.error("❌ Erreur refetch organisation:", error);
    });
  }, [refetchOrganization]);

  // Initialiser avec la valeur existante ET forcer la mise à jour quand l'organisation change
  useEffect(() => {
    const currentLogo = watch("logo");
    console.log("🔄 useEffect CompanySection - currentLogo:", currentLogo, "logoUrl:", logoUrl);
    if (currentLogo !== logoUrl) {
      console.log("🔄 Mise à jour logoUrl:", currentLogo || null);
      setLogoUrl(currentLogo || null);
    }
  }, [watch("logo"), logoUrl]);

  // Forcer la mise à jour quand l'organisation change
  useEffect(() => {
    if (organization?.logo !== logoUrl) {
      console.log("🔄 Organisation changée - nouveau logo:", organization?.logo);
      setLogoUrl(organization?.logo || null);
      setValue("logo", organization?.logo || null);
      
      // Si le logo est null, forcer le nettoyage complet
      if (organization?.logo === null || organization?.logo === undefined) {
        console.log("🧹 Logo null détecté - nettoyage forcé");
        setLogoUrl(null);
        setValue("logo", null);
        
        // Forcer la re-render du composant
        setTimeout(() => {
          setLogoUrl(null);
          setValue("logo", null);
        }, 50);
      }
    }
  }, [organization?.logo, logoUrl, setValue]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-medium">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo de l'entreprise */}
          <div className="flex items-start gap-4 p-4 bg-gray-100/80 dark:bg-[#000] rounded-xl">
            <CompanyLogoUpload
              currentImageUrl={logoUrl}
              onImageChange={handleLogoChange}
              onOrganizationUpdate={handleOrganizationUpdate}
              showDescription={false}
            />
            <div className="flex-1">
              <Label className="text-sm font-medium">
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
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  e.target.value = sanitized;
                }}
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
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value, "email");
                  e.target.value = sanitized;
                }}
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
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value, "phone");
                  e.target.value = sanitized;
                }}
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
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  e.target.value = sanitized;
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
