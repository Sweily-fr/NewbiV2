"use client";

import { Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import ClientSelector from "../client-selector";

export default function ClientSelectorSection({ data, updateField, canEdit }) {
  return (
    <Card className="shadow-none border-none p-2">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Sélection d'un client
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ClientSelector
          selectedClient={data.client}
          onClientSelect={(client) => updateField("client", client)}
          disabled={!canEdit}
        />
      </CardContent>
    </Card>
  );
}
