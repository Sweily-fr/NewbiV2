import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
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
        <div className="flex justify-between gap-4 w-full">
          <div className="w-full">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Prénom
            </Label>
            <Input
              type="text"
              id="firstName"
              className="mt-2"
              placeholder="Prénom"
              value={""}
              {...register("firstName")}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="lastName"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Nom
            </Label>
            <Input
              type="text"
              id="lastName"
              className="mt-2"
              placeholder="Nom"
              value={""}
              {...register("lastName")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-4 w-full">
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
              disabled
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
