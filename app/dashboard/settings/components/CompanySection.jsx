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

export default function CompanySection({
  register,
  errors,
  watch,
  setValue,
  session,
}) {
  const [logoUrl, setLogoUrl] = React.useState(watch("logo") || null);

  // Mettre à jour l'URL du logo dans le formulaire
  const handleLogoChange = (imageUrl) => {
    setLogoUrl(imageUrl);
    setValue("logo", imageUrl);
  };

  // Initialiser avec la valeur existante
  useEffect(() => {
    const currentLogo = watch("logo");
    if (currentLogo && currentLogo !== logoUrl) {
      setLogoUrl(currentLogo);
    }
  }, [watch("logo"), logoUrl]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          {/* Logo de l'entreprise */}
          <div className="flex items-start gap-4">
            <CompanyLogoUpload
              currentImageUrl={logoUrl}
              onImageChange={handleLogoChange}
              showDescription={false}
            />
            <div className="flex-1">
              <Label className="text-sm font-medium">
                Logo de l'entreprise
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Glissez une image ou cliquez pour uploader le logo de votre entreprise.
                Formats acceptés : JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>

          {/* Nom de l'entreprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'entreprise *</Label>
              <Input
                id="name"
                placeholder="Nom de votre entreprise"
                {...register("name", { required: "Le nom est requis" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel *</Label>
              <InputEmail
                id="email"
                type="email"
                placeholder="contact@entreprise.com"
                {...register("email", {
                  required: "L'email est requis",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email invalide",
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
              <Label htmlFor="phone">Téléphone</Label>
              <InputPhone
                id="phone"
                placeholder="+33 1 23 45 67 89"
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <InputEndAddOn
                id="website"
                placeholder="https://www.entreprise.com"
                {...register("website")}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description de l'entreprise</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre entreprise..."
              rows={4}
              {...register("description")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
