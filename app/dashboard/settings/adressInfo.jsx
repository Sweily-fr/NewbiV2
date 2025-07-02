import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { useImageUpload } from "@/src/components/ui/image-upload";
import { Separator } from "@/src/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default function AdressInfo({
  register,
  session,
  handleSubmit,
  updateCompanyInfo,
}) {
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange } =
    useImageUpload();

  const profileImage = previewUrl || "https://github.com/shadcn.png";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adresse</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pl-6 pr-6 pb-6">
        <form onSubmit={handleSubmit(updateCompanyInfo)}>
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex justify-between gap-8 w-full">
              <div className="w-full">
                <Label
                  htmlFor="street"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Rue
                </Label>
                <Input
                  type="text"
                  id="street"
                  className="mt-2"
                  placeholder="rue"
                  {...register("address.street")}
                />
              </div>
            </div>
            <div className="flex justify-between gap-8 w-full">
              <div className="w-full">
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Ville
                </Label>
                <Input
                  type="text"
                  id="city"
                  className="mt-2"
                  placeholder="ville"
                  {...register("address.city")}
                />
              </div>
              <div className="w-full">
                <Label
                  htmlFor="postalCode"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Code postal
                </Label>
                <Input
                  type="tel"
                  id="postalCode"
                  className="mt-2"
                  placeholder="code postal"
                  {...register("address.postalCode")}
                />
              </div>
            </div>
            <div className="flex justify-between gap-8 w-full">
              <div className="w-full">
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Pays
                </Label>
                <Input
                  type="text"
                  id="country"
                  className="mt-2"
                  placeholder="pays"
                  {...register("address.country")}
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
