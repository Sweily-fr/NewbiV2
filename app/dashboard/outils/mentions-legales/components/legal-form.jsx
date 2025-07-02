"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

const legalFormSchema = z.object({
  // Informations sur l'entreprise
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  legalForm: z.string().min(1, "La forme juridique est requise"),
  address: z.string().min(1, "L'adresse est requise"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  socialCapital: z.string().optional(),
  publicationDirector: z
    .string()
    .min(1, "Le nom du directeur de publication est requis"),
  rcs: z.string().optional(),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),

  // Informations sur le site web
  websiteUrl: z.string().url("URL invalide"),

  // Informations sur l'hébergeur
  hostName: z.string().min(1, "Le nom de l'hébergeur est requis"),
  hostAddress: z.string().optional(),
  hostPhone: z.string().optional(),
  hostEmail: z.string().optional(),
});

const legalForms = [
  "SARL",
  "SAS",
  "SA",
  "EURL",
  "SNC",
  "Auto-entrepreneur",
  "Association",
  "Autre",
];

export function LegalForm({ onFormChange }) {
  const form = useForm({
    resolver: zodResolver(legalFormSchema),
    defaultValues: {
      companyName: "",
      legalForm: "",
      address: "",
      email: "",
      phone: "",
      socialCapital: "",
      publicationDirector: "",
      rcs: "",
      siret: "",
      tvaNumber: "",
      websiteUrl: "https://www.example.com",
      hostName: "",
      hostAddress: "",
      hostPhone: "",
      hostEmail: "",
    },
  });

  // Utiliser useEffect avec une dépendance sur form.formState.isDirty pour éviter les boucles infinies
  useEffect(() => {
    // Ne déclencher le callback que lorsque le formulaire est "dirty" (modifié)
    if (form.formState.isDirty) {
      // Débouncer la mise à jour pour éviter les mises à jour trop fréquentes
      const timer = setTimeout(() => {
        const values = form.getValues();
        onFormChange(values);
      }, 300); // Attendre 300ms avant de mettre à jour

      return () => clearTimeout(timer); // Nettoyer le timer si le composant est démonté ou si l'effet est réexécuté
    }
  }, [form.formState.isDirty, form, onFormChange]);

  const onSubmit = (data) => {
    console.log("Données du formulaire:", data);
    // Ici vous pouvez ajouter la logique pour générer le document
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 pt-6 pr-8"
        >
          {/* Informations sur l'entreprise */}

          <h2 className="text-lg font-semibold">
            Informations sur l'entreprise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'entreprise *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de votre entreprise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legalForm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forme juridique</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez une forme juridique" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {legalForms.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adresse complète de l'entreprise"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@entreprise.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="01 23 45 67 89" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="socialCapital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capital social (en euros)</FormLabel>
                  <FormControl>
                    <Input placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publicationDirector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du directeur de publication *</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom Nom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="rcs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RCS</FormLabel>
                  <FormControl>
                    <Input placeholder="123 456 789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SIRET</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tvaNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de TVA</FormLabel>
                  <FormControl>
                    <Input placeholder="FR12345678901" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator />
          {/* Informations sur le site web */}
          <h2 className="text-lg font-semibold">
            Informations sur le site web
          </h2>
          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL du site web *</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          {/* Informations sur l'hébergeur */}
          <h2 className="text-lg font-semibold">
            Informations sur l'hébergeur
          </h2>
          <FormField
            control={form.control}
            name="hostName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'hébergeur *</FormLabel>
                <FormControl>
                  <Input placeholder="Nom de l'hébergeur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hostAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse de l'hébergeur</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adresse complète de l'hébergeur"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hostPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone de l'hébergeur</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 06 12 34 56 78" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hostEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de l'hébergeur</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@hebergeur.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* <Button type="submit" className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
            Générer les mentions légales
          </Button> */}
        </form>
      </Form>
    </div>
  );
}
