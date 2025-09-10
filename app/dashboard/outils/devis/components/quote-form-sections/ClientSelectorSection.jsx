"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import ClientSelector from "./client-selector";

export default function ClientSelectorSection({ canEdit }) {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const data = watch();

  const handleClientSelect = (client) => {
    console.log('🎯 ClientSelectorSection - Client sélectionné:', client);
    setValue('client', client, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Card className="shadow-none border-none p-2 bg-transparent">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="flex items-center gap-2 font-normal text-lg">
          Sélection d'un client
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-6">
          <ClientSelector
            onSelect={handleClientSelect}
            selectedClient={data.client}
            placeholder="Rechercher ou créer un client..."
            disabled={!canEdit}
            className="w-full"
          />
          {errors?.client && (
            <p className="text-xs text-red-500">
              <Label className="text-sm font-normal">Client</Label>
              {errors.client.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
