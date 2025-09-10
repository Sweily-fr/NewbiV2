"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_TRANSFER_BY_LINK } from "@/app/dashboard/outils/transferts-fichiers/graphql/mutations";
import { Button } from "@/src/components/ui/button";
import { Typewriter } from "@/src/components/ui/typewriter-text";
import { CircleArrowUp, File, Download, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
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

  // Debug: Afficher la structure de la réponse
  console.log("🔍 Debug - Réponse complète:", data);
  console.log("🔍 Debug - Transfer:", transfer);
  console.log("🔍 Debug - FileTransfer:", transfer?.fileTransfer);
  console.log("🔍 Debug - Files:", transfer?.fileTransfer?.files);

  // Fonction pour télécharger un fichier
  const downloadFile = async (fileId, fileName) => {
    setIsDownloading(true);
    try {
      console.log("Début téléchargement:", {
        fileId,
        fileName,
        shareLink,
        accessKey,
      });

      const downloadUrl = `/api/transfer/download/${fileId}?shareLink=${shareLink}&accessKey=${accessKey}`;
      console.log("URL de téléchargement:", downloadUrl);

      // Faire une requête fetch pour récupérer le fichier
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();

      // Créer une URL temporaire pour le blob
      const url = window.URL.createObjectURL(blob);

      // Créer un lien de téléchargement et le déclencher
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Nettoyer
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Fichier téléchargé avec succès");
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

  const isExpired = new Date(transfer?.fileTransfer?.expiryDate) < new Date();

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex items-center justify-center p-2">
        <div className="mx-auto sm:max-w-xl w-full">
          <div className="mb-8">
            <h1 className="text-xl font-medium mb-2">
              Téléchargez les fichiers partagés avec vous
            </h1>
            <p className="text-sm text-gray-600">
              Téléchargez les fichiers partagés avec vous
            </p>
          </div>

          <Card className="mb-6 shadow-none border-none">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center justify-between font-normal">
                <span>Informations du transfert</span>
                <Badge
                  className="bg-[#5b4fff]/20 border-[#5b4fff]/70"
                  variant={isExpired ? "destructive" : "default"}
                >
                  <span className="text-[#5b4fff]/90">
                    {isExpired ? "Expiré" : "Actif"}
                  </span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <File size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-600">
                    {transfer?.fileTransfer?.files?.length || 0} fichier(s)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-600">
                    Expire le {formatDate(transfer?.fileTransfer?.expiryDate)}
                  </span>
                </div>
                {transfer?.fileTransfer?.recipientEmail && (
                  <div className="flex items-center space-x-2">
                    <IconUser size={16} className="text-gray-500" />
                    <span className="text-xs text-gray-600">
                      Pour: {transfer?.fileTransfer?.recipientEmail}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Download size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-600">
                    {transfer?.fileTransfer?.downloadCount || 0}{" "}
                    téléchargement(s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {transfer?.fileTransfer?.isPaymentRequired &&
            !transfer?.fileTransfer?.isPaid && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">
                      Paiement requis
                    </h3>
                    <p className="text-orange-700 mb-4">
                      Ce transfert nécessite un paiement de{" "}
                      {transfer?.fileTransfer?.paymentAmount}{" "}
                      {transfer?.fileTransfer?.paymentCurrency}
                    </p>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      Procéder au paiement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          <Card className="shadow-none border-none">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center font-normal justify-between">
                <span>
                  Fichiers ({transfer?.fileTransfer?.files?.length || 0})
                </span>
                {transfer?.fileTransfer?.files?.length > 1 && !isExpired && (
                  <Button
                    onClick={downloadAllFiles}
                    disabled={isDownloading}
                    className="ml-4 font-normal cursor-pointer bg-[#5b4fff]/80 border-[#5b4fff]/80 hover:bg-[#5b4fff]/90"
                  >
                    {isDownloading ? "Téléchargement..." : "Tout télécharger"}
                    <Download size={16} />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transfer?.fileTransfer?.files?.length > 0 ? (
                <div className="space-y-3">
                  {transfer?.fileTransfer?.files.map((file, index) => (
                    <div
                      key={file.id || index}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <File size={16} className="text-gray-500" />
                        <div>
                          <p className="font-normal text-sm">
                            {file.originalName}
                          </p>
                          <p className="text-xs font-normal text-gray-500">
                            {formatFileSize(file.size)} • {file.mimeType}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => downloadFile(file.id, file.originalName)}
                        disabled={isDownloading || isExpired}
                        size="sm"
                      >
                        <Download size={16} className="cursor-pointer" />
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
      <div className="w-1/2 p-5 flex items-center min-h-screen justify-center">
        <div
          className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center relative"
          style={{ backgroundImage: "url('/BackgroundAuth.svg')" }}
        >
          <div className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto">
            <div className="text-lg min-h-[27px] flex items-center justify-between">
              <div className="flex-1">
                <Typewriter
                  text={[
                    "Téléchargez vos fichiers en toute sécurité.",
                    "Partagez facilement avec vos collaborateurs.",
                    "Accédez à vos documents où que vous soyez.",
                  ]}
                  speed={30}
                  deleteSpeed={30}
                  delay={2000}
                  loop={true}
                  className="font-medium text-left text-[#1C1C1C] text-[15px]"
                />
              </div>
              <CircleArrowUp className="ml-4 text-[#1C1C1C] flex-shrink-0" />
            </div>
          </div>
          <img
            src="/ni.svg"
            alt="Newbi Logo"
            className="absolute bottom-2 right-3 w-5 h-auto filter brightness-0 invert"
            style={{ opacity: 0.9 }}
          />
        </div>
      </div>
    </div>
  );
}
