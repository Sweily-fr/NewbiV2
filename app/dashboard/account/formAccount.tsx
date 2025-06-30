import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
// import { User } from "../../hooks/useSession";
import { updateUserProfile } from "../../../src/lib/auth/api";
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
import { toast } from "sonner";
import { updateUser, useSession } from "../../../src/lib/auth-client";

export default function ProfileForm({ user }: { user: any }) {
  const { data: session, isPending, error, refetch } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    setError: setFormError,
    reset,
  } = useForm<{
    email: string;
    name: string;
    lastName: string;
    phone: string;
  }>({
    defaultValues: {
      email: "",
      name: "",
      lastName: "",
      phone: "",
    },
  });

  // Mettre à jour les valeurs du formulaire lorsque les données de session sont disponibles
  useEffect(() => {
    if (session?.user) {
      reset({
        email: session.user.email || "",
        name: session.user.name || "",
        lastName: session.user.lastName || "",
        phone: session.user.phone || "",
      });
    }
  }, [session, reset]);

  const onSubmit = async (formData: any) => {
    console.log({
      name: formData.name,
      lastName: formData.lastName,
      phone: formData.phone,
    });
    await updateUser(
      {
        name: formData.name,
        lastName: formData.lastName,
        phone: formData.phone,
      },
      {
        onSuccess: () => {
          toast.success("Profil mis à jour avec succès");
        },
        onError: (error) => {
          toast.error("Erreur lors de la mise à jour du profil");
        },
      }
    );
  };

  // const onSubmit = async (formData: any) => {
  //   try {
  //     const changedFields: Record<string, any> = {};

  //     Object.keys(dirtyFields).forEach((field) => {
  //       if (field !== "email") {
  //         changedFields[field] = formData[field];
  //       }
  //     });

  //     if (Object.keys(changedFields).length > 0) {
  //       const res = await updateUserProfile(changedFields);
  //       if (res) {
  //         toast("Profil mis à jour avec succès");
  //       }
  //     }
  //   } catch (err: any) {
  //     toast(err.message || "Erreur lors de la mise à jour du profil");
  //     setFormError("root", {
  //       type: "manual",
  //       message: err.message || "Erreur lors de la mise à jour du profil",
  //     });
  //   }
  // };

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
              id="name"
              className="mt-2"
              placeholder="Prénom"
              defaultValue={user?.name}
              {...register("name")}
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
              defaultValue={user?.lastName}
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
              defaultValue={user?.email}
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
              defaultValue={user?.phone}
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
