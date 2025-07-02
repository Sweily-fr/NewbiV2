import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default function LegalForm({
  register,
  session,
  handleSubmit,
  updateCompanyInfo,
  onSubmit,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Legales</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pl-6 pr-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex justify-between gap-8 w-full">
              <div className="w-full">
                <Label
                  htmlFor="siret"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Numéro de SIRET
                </Label>
                <Input
                  type="text"
                  id="siret"
                  className="mt-2"
                  placeholder="Numéro de SIRET"
                  value={""}
                  {...register("siret")}
                />
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
              <div className="w-full">
                <Label
                  htmlFor="rcs"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  RCS
                </Label>
                <Input
                  type="text"
                  id="rcs"
                  className="mt-2"
                  placeholder="RCS"
                  value={""}
                  {...register("rcs")}
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
                    <SelectItem value="1">
                      Catégorie de transaction 1
                    </SelectItem>
                    <SelectItem value="2">
                      Catégorie de transaction 2
                    </SelectItem>
                    <SelectItem value="3">
                      Catégorie de transaction 3
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
