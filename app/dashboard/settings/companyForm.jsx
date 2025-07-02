import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
import { useImageUpload } from "@/src/components/ui/image-upload";
import { ImagePlus } from "lucide-react";
import { Separator } from "@/src/components/ui/separator";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default function CompanyForm({
  register,
  session,
  handleSubmit,
  updateCompanyInfo,
  setLogoUrl,
}) {
  // La logique de mise à jour est maintenant gérée dans page.tsx
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange } =
    useImageUpload();

  // Mettre à jour l'URL du logo dans le composant parent
  useEffect(() => {
    if (previewUrl) {
      setLogoUrl(previewUrl);
    }
  }, [previewUrl, setLogoUrl]);

  const profileImage = previewUrl || "https://github.com/shadcn.png";

  // <Card>
  //     <CardHeader>
  //       <CardTitle>Entreprise</CardTitle>
  //     </CardHeader>
  //     <Separator />
  //     <CardContent className="pl-6 pr-6 pb-6">
  //       <CompanyInfo
  //         register={register}
  //         session={session}
  //         handleSubmit={handleSubmit}
  //         updateCompanyInfo={updateCompanyInfo}
  //         setLogoUrl={setLogoUrl}
  //       />
  //     </CardContent>
  //   </Card>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entreprise</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pl-6 pr-6 pb-6">
        <form onSubmit={handleSubmit(updateCompanyInfo)}>
          <div className="flex flex-col gap-4 md:gap-6">
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
            <div className="flex flex-col md:flex-row gap-8 mt-4">
              <div className="w-full">
                <Label htmlFor="nomEntreprise">Nom de l'entreprise</Label>
                <Input
                  id="nomEntreprise"
                  className="mt-2"
                  placeholder="nom de l'entreprise"
                  {...register("name")}
                />
              </div>
              <div className="w-full">
                <Label htmlFor="statut">Statut juridique</Label>
                <Select>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Statut juridique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarl">SARL</SelectItem>
                    <SelectItem value="sas">SAS</SelectItem>
                    <SelectItem value="eurl">EURL</SelectItem>
                    <SelectItem value="ei">EI</SelectItem>
                    <SelectItem value="sa">SA</SelectItem>
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
                  {...register("email")}
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
                  {...register("website")}
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
