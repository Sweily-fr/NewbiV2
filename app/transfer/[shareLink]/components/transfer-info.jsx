"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { File, Timer, Download, User as IconUser } from "lucide-react";

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function TransferInfo({
  filesCount,
  expiryDate,
  recipientEmail,
  downloadCount,
  isExpired,
}) {
  return (
    <Card className="mb-6 shadow-none border-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center justify-between font-normal">
          <span>Informations du transfert</span>
          <Badge
            className="bg-[#5b4fff]/20 border-[#5b4fff]/70"
            variant={isExpired ? "destructive" : "default"}
          >
            <span className="text-[#5b4fff]/90 font-normal">
              {isExpired ? "Expiré" : "Actif"}
            </span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-2">
            <File size={16} className="text-gray-500" />
            <span className="text-xs text-gray-600">
              {filesCount || 0} fichier(s)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Timer size={16} className="text-gray-500" />
            <span className="text-xs text-gray-600">
              Expire le {formatDate(expiryDate)}
            </span>
          </div>
          {recipientEmail && (
            <div className="flex items-center space-x-2">
              <IconUser size={16} className="text-gray-500" />
              <span className="text-xs text-gray-600">
                Pour: {recipientEmail}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Download size={16} className="text-gray-500" />
            <span className="text-xs text-gray-600">
              {downloadCount || 0} téléchargement(s)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
