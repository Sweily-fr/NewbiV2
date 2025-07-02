import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { useForm } from "react-hook-form";
import { Separator } from "@/src/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default function BankForm({
  register,
  session,
  handleSubmit,
  updateCompanyInfo,
}) {
  const {
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm({
    defaultValues: {
      bankDetails: {
        iban: "",
        bic: "",
        bankName: "",
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coordonnees Bancaires</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pl-6 pr-6 pb-6">
        <form onSubmit={handleSubmit(updateCompanyInfo)}>
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
                  placeholder="IBAN"
                  {...register("bankDetails.iban")}
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
                  placeholder="BIC/SWIFT"
                  {...register("bankDetails.bic")}
                />
              </div>
              <div className="w-full">
                <Label
                  htmlFor="bankName"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Nom de la banque
                </Label>
                <Input
                  type="text"
                  id="bankName"
                  className="mt-2"
                  placeholder="nom de la banque"
                  {...register("bankDetails.bankName")}
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
