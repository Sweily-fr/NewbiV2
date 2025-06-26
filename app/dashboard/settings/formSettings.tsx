import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
// import { User } from "../../hooks/useSession";
// import { updateUserProfile } from "../../api/userApi";
import { useImageUpload } from "@/src/components/ui/image-upload";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ImagePlus } from "lucide-react";

export default function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      const updateProfileData = {
        name: formData.name,
        lastName: formData.lastName,
        phone: formData.phone,
      };
      //   await updateUserProfile(updateProfileData);
    } catch (err) {
      setFormError("root", {
        type: "manual",
        message: (err as string) || "Erreur lors de l'inscription",
      });
      console.error(err);
    }
  };
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange } =
    useImageUpload();

  const profileImage = previewUrl || "https://github.com/shadcn.png";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
        <div className="flex justify-start pb-2">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg rounded-full">
              <AvatarImage
                src={profileImage || "https://github.com/shadcn.png"}
                alt="Profile"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <button
              onClick={handleThumbnailClick}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Change profile picture"
            >
              <ImagePlus size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Statut juridique
            </Label>
            <Select>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Statut juridique 1</SelectItem>
                <SelectItem value="2">Statut juridique 2</SelectItem>
                <SelectItem value="3">Statut juridique 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Régime de TVA
            </Label>
            <Select>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Régime de TVA 1</SelectItem>
                <SelectItem value="2">Régime de TVA 2</SelectItem>
                <SelectItem value="3">Régime de TVA 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Adresse email
            </Label>
            <Input
              type="email"
              id="email"
              className="mt-2"
              placeholder="Adresse email"
              defaultValue={""}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Numéro de téléphone
            </Label>
            <Input
              type="tel"
              id="phone"
              className="mt-2"
              placeholder="xx xx xx xx xx"
              value={""}
              {...register("phone")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="siteWeb"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Site web
            </Label>
            <Input
              type="text"
              id="siteWeb"
              className="mt-2"
              placeholder="site web"
              value={""}
              {...register("siteWeb")}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="numTVA"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Numéro de TVA
            </Label>
            <Input
              type="text"
              id="numTVA"
              className="mt-2"
              placeholder="Numéro de TVA"
              value={""}
              {...register("numTVA")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="numSIRET"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Numéro de SIRET
            </Label>
            <Input
              type="text"
              id="numSIRET"
              className="mt-2"
              placeholder="Numéro de SIRET"
              value={""}
              {...register("numSIRET")}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="capitalSocial"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Capital social
            </Label>
            <Input
              type="text"
              id="capitalSocial"
              className="mt-2"
              placeholder="Capital social"
              value={""}
              {...register("capitalSocial")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="villeImmatriculation"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Ville d'immatriculation RCS
            </Label>
            <Input
              type="text"
              id="villeImmatriculation"
              className="mt-2"
              placeholder="Ville d'immatriculation RCS"
              value={""}
              {...register("villeImmatriculation")}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Catégorie de transaction
            </Label>
            <Select>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Catégorie de transaction 1</SelectItem>
                <SelectItem value="2">Catégorie de transaction 2</SelectItem>
                <SelectItem value="3">Catégorie de transaction 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* <div>
          <Label
            htmlFor="newEmail"
            className="text-sm font-medium text-foreground dark:text-foreground"
          >
            Nouvelle adresse email
          </Label>
          <Input
            type="email"
            id="newEmail"
            placeholder="Nouvelle adresse email"
            className="mt-2"
            {...register("newEmail", {
              required: "La nouvelle adresse email est requise",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Adresse email invalide",
              },
            })}
          />
          {errors.newEmail && (
            <p className="mt-2 text-sm text-red-500">
              {errors.newEmail.message}
            </p>
          )}
        </div> */}

        <div className="flex justify-between gap-4 h-full mt-4">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="py-2 font-medium border rounded-md"
              // onClick={() => navigate("/dashboard/account/password")}
            >
              Modifier le mot de passe
            </Button>
            {/* <Button
              variant="default"
              type="submit"
              className="py-2 font-medium"
              disabled={isSubmitting}
            >
              Modifier l'email
            </Button> */}
          </div>
          <Button
            variant="default"
            type="submit"
            className="py-2 font-medium"
            disabled={isSubmitting}
          >
            Mettre à jour le profil
          </Button>
        </div>
      </div>
    </form>
  );
}
