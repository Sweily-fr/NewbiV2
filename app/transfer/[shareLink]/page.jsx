"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_TRANSFER_BY_LINK } from "@/app/dashboard/outils/transferts-fichiers/graphql/mutations";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  IconDownload,
  IconFile,
  IconClock,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "@/src/components/ui/sonner";
import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "./components/aura-background";

export default function TransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareLink = params.shareLink;
  const accessKey = searchParams.get("key");

  const [isDownloading, setIsDownloading] = useState(false);

  // Query pour récupérer les détails du transfert
  const { data, loading, error } = useQuery(GET_TRANSFER_BY_LINK, {
    variables: {
      shareLink,
      accessKey,
    },
    skip: !shareLink || !accessKey,
  });

  const transfer = data?.getFileTransferByLink;

  // Fonction pour télécharger un fichier
  const downloadFile = async (fileId, fileName) => {
    setIsDownloading(true);
    try {
      // Ici, vous devrez implémenter l'endpoint de téléchargement
      const response = await fetch(
        `/api/transfer/download/${fileId}?shareLink=${shareLink}&accessKey=${accessKey}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Fichier téléchargé avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour télécharger tous les fichiers
  const downloadAllFiles = async () => {
    setIsDownloading(true);
    try {
      // Ici, vous devrez implémenter l'endpoint de téléchargement en ZIP
      const response = await fetch(
        `/api/transfer/download-all?shareLink=${shareLink}&accessKey=${accessKey}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transfer-${shareLink}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Fichiers téléchargés avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement des fichiers");
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour formater la taille des fichiers
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!shareLink || !accessKey) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Lien invalide</h1>
        <p className="text-gray-600">
          Le lien de transfert est invalide ou incomplet.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Chargement du transfert...</p>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Transfert introuvable
        </h1>
        <p className="text-gray-600">
          Le transfert demandé n'existe pas ou a expiré.
        </p>
        <p className="text-sm text-gray-500 mt-2">{error?.message}</p>
      </div>
    );
  }

  const isExpired = new Date(transfer.expiryDate) < new Date();

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4 z-10"
      >
        <div className="container mx-auto py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Transfert de fichiers</h1>
              <p className="text-gray-600">
                Téléchargez les fichiers partagés avec vous
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Informations du transfert</span>
                  <Badge variant={isExpired ? "destructive" : "default"}>
                    {isExpired ? "Expiré" : "Actif"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <IconFile size={20} className="text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {transfer.files?.length || 0} fichier(s)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconClock size={20} className="text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Expire le {formatDate(transfer.expiryDate)}
                    </span>
                  </div>
                  {transfer.recipientEmail && (
                    <div className="flex items-center space-x-2">
                      <IconUser size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Pour: {transfer.recipientEmail}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <IconDownload size={20} className="text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {transfer.downloadCount || 0} téléchargement(s)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {transfer.isPaymentRequired && !transfer.isPaid && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">
                      Paiement requis
                    </h3>
                    <p className="text-orange-700 mb-4">
                      Ce transfert nécessite un paiement de{" "}
                      {transfer.paymentAmount} {transfer.paymentCurrency}
                    </p>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      Procéder au paiement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fichiers ({transfer.files?.length || 0})</span>
                  {transfer.files?.length > 1 && !isExpired && (
                    <Button
                      onClick={downloadAllFiles}
                      disabled={isDownloading}
                      className="ml-4"
                    >
                      <IconDownload size={16} className="mr-2" />
                      {isDownloading ? "Téléchargement..." : "Tout télécharger"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transfer.files?.length > 0 ? (
                  <div className="space-y-3">
                    {transfer.files.map((file, index) => (
                      <div
                        key={file.id || index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <IconFile size={24} className="text-gray-500" />
                          <div>
                            <p className="font-medium">{file.originalName}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {file.mimeType}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            downloadFile(file.id, file.originalName)
                          }
                          disabled={isDownloading || isExpired}
                          size="sm"
                        >
                          <IconDownload size={16} className="mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Aucun fichier disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {isExpired && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-center">
                  Ce transfert a expiré et n'est plus disponible au
                  téléchargement.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
