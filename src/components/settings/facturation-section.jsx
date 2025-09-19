"use client";

import { useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

export default function FacturationSection() {
  const [factures] = useState([
    {
      id: 1,
      date: "30 avril 2024",
      status: "credited",
      amount: "3,68 €",
      type: "Créditée",
    },
    {
      id: 2,
      date: "30 mars 2024",
      status: "paid",
      amount: "22,80 €",
      type: "Payée",
    },
    {
      id: 3,
      date: "29 février 2024",
      status: "credited",
      amount: "5,70 €",
      type: "Créditée",
    },
    {
      id: 4,
      date: "30 janvier 2024",
      status: "paid",
      amount: "57 €",
      type: "Payée",
    },
    {
      id: 5,
      date: "30 décembre 2023",
      status: "paid",
      amount: "57 €",
      type: "Payée",
    },
    {
      id: 6,
      date: "30 novembre 2023",
      status: "paid",
      amount: "57 €",
      type: "Payée",
    },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 text-xs border-green-200"
          >
            Payée
          </Badge>
        );
      case "credited":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 text-xs border-blue-200"
          >
            Créditée
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewInvoice = (factureId) => {
    console.log("Afficher la facture:", factureId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium mb-1">Facturation</h2>
        <Separator />
      </div>

      {/* Factures Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium mb-4">Factures</h3>

          <div className="space-y-3">
            {factures.map((facture) => (
              <div
                key={facture.id}
                className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2c2c2c]"
              >
                <div className="flex items-center gap-4">
                  {/* <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                    <FileText className="h-3 w-3 text-gray-600" />
                  </div> */}

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm text-gray-200">
                        {facture.date}
                      </span>
                      {/* {getStatusBadge(facture.status)} */}
                    </div>
                    <div className="text-xs text-gray-400">
                      {facture.type} • {facture.amount}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInvoice(facture.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    Afficher la facture
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {factures.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune facture
            </h3>
            <p className="text-sm text-gray-500">
              Vos factures apparaîtront ici une fois générées.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
