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

const COUNTRIES = [
  { value: "France", label: "France" },
  { value: "Belgique", label: "Belgique" },
  { value: "Suisse", label: "Suisse" },
  { value: "Canada", label: "Canada" },
  { value: "Luxembourg", label: "Luxembourg" },
];

export default function AddressSection({ register, errors, watch, setValue }) {
  const selectedCountry = watch("address.country");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adresse de l'entreprise</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          {/* Adresse complète */}
          <div className="space-y-2">
            <Label htmlFor="address.street">Adresse *</Label>
            <Input
              id="address.street"
              placeholder="123 Rue de la République"
              {...register("address.street", { required: "L'adresse est requise" })}
            />
            {errors.address?.street && (
              <p className="text-sm text-red-500">{errors.address.street.message}</p>
            )}
          </div>

          {/* Ville et code postal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.city">Ville *</Label>
              <Input
                id="address.city"
                placeholder="Paris"
                {...register("address.city", { required: "La ville est requise" })}
              />
              {errors.address?.city && (
                <p className="text-sm text-red-500">{errors.address.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.postalCode">Code postal *</Label>
              <Input
                id="address.postalCode"
                placeholder="75001"
                {...register("address.postalCode", { required: "Le code postal est requis" })}
              />
              {errors.address?.postalCode && (
                <p className="text-sm text-red-500">{errors.address.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Pays */}
          <div className="space-y-2">
            <Label htmlFor="address.country">Pays *</Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => setValue("address.country", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez un pays" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.address?.country && (
              <p className="text-sm text-red-500">{errors.address.country.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
