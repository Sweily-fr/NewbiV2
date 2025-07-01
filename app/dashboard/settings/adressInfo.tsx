import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
import { useImageUpload } from "@/src/components/ui/image-upload";
import { ImagePlus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export default function AdressInfo() {
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
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="siteWeb"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Rue
            </Label>
            <Input
              type="text"
              id="rue"
              className="mt-2"
              placeholder="rue"
              value={""}
              {...register("rue")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="ville"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Ville
            </Label>
            <Input
              type="text"
              id="ville"
              className="mt-2"
              placeholder="ville"
              defaultValue={""}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="codePostal"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Code postal
            </Label>
            <Input
              type="tel"
              id="codePostal"
              className="mt-2"
              placeholder="code postal"
              value={""}
              {...register("codePostal")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="pays"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Pays
            </Label>
            <Input
              type="text"
              id="pays"
              className="mt-2"
              placeholder="pays"
              value={""}
              {...register("pays")}
            />
          </div>
        </div>
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
