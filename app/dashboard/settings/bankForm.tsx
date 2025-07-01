import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";

export default function BankForm() {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="iban"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              IBAN
            </Label>
            <Input
              type="text"
              id="iban"
              className="mt-2"
              placeholder="iban"
              value={""}
              {...register("iban")}
            />
          </div>
        </div>
        <div className="flex justify-between gap-8 w-full">
          <div className="w-full">
            <Label
              htmlFor="bic"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              BIC/SWIFT
            </Label>
            <Input
              type="text"
              id="bic"
              className="mt-2"
              placeholder="bic"
              defaultValue={""}
            />
          </div>
          <div className="w-full">
            <Label
              htmlFor="nameBank"
              className="text-sm font-medium text-foreground dark:text-foreground"
            >
              Nom de la banque
            </Label>
            <Input
              type="tel"
              id="nameBank"
              className="mt-2"
              placeholder="nomBanque"
              value={""}
              {...register("nameBank")}
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
