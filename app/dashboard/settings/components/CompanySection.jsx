import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import {
  Input,
  InputEmail,
  InputPhone,
  InputEndAddOn,
} from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { useImageUpload } from "@/src/components/ui/image-upload";
import { ImagePlus } from "lucide-react";
import { Separator } from "@/src/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
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
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange } =
    useImageUpload();

  // Mettre à jour l'URL du logo
  useEffect(() => {
    if (previewUrl) {
      setValue("logo", previewUrl);
    }
  }, [previewUrl, setValue]);

  const profileImage =
    previewUrl || watch("logo") || "https://github.com/shadcn.png";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          {/* Logo de l'entreprise */}
          <div className="flex items-center gap-4">
            <Avatar
              className="h-20 w-20 cursor-pointer"
              onClick={handleThumbnailClick}
            >
              <AvatarImage src={profileImage} alt="Logo de l'entreprise" />
              <AvatarFallback>
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Label className="text-sm font-medium">
                Logo de l'entreprise
              </Label>
              <p className="text-sm text-muted-foreground">
                Cliquez sur l'avatar pour changer le logo
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
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
