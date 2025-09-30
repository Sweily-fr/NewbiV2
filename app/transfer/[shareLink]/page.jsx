"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_TRANSFER_BY_LINK } from "@/app/dashboard/outils/transferts-fichiers/graphql/mutations";
import { Button } from "@/src/components/ui/button";
import { Typewriter } from "@/src/components/ui/typewriter-text";
import {
  CircleArrowUp,
  File,
  Download,
  Timer,
  User as IconUser,
} from "lucide-react";
import { useStripePayment } from "@/src/hooks/useStripePayment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "@/src/components/ui/sonner";
import { motion } from "framer-motion";
import { Separator } from "@/src/components/ui/separator";
import React from "react";
import { AuroraBackground } from "./components/aura-background";
import { Confetti } from "@/src/components/magicui/confetti";

export default function TransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareLink = params.shareLink;
  const accessKey = searchParams.get("key");
  const paymentStatus = searchParams.get("payment_status");

  const [isDownloading, setIsDownloading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");
  const confettiRef = useRef(null);

  // Liste des images disponibles dans le dossier linkTransfert
  const availableImages = [
    "daniela-kokina-hOhlYhAiizc.png",
    "lukasz-szmigiel-jFCViYFYcus.png",
    "mark-basarab-1OtUkD_8svc.png",
    "mourad-saadi-GyDktTa0Nmw.png"
  ];

  // Fonction pour sélectionner une image aléatoire
  const getRandomBackgroundImage = () => {
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const selectedImage = availableImages[randomIndex];
    return `/images/linkTransfert/${selectedImage}`;
  };

  // Sélectionner une image aléatoire au chargement
  useEffect(() => {
    setBackgroundImage(getRandomBackgroundImage());
  }, []);

  // Hook pour gérer les paiements Stripe
  const { initiatePayment, isProcessing } = useStripePayment();

  // Déclencher confetti si paiement réussi
  useEffect(() => {
    if (paymentStatus === "success") {
      // Délai pour laisser la page se charger
      const timer = setTimeout(() => {
        // Toast de succès
        toast.success(
          "Paiement effectué avec succès! Vous pouvez maintenant télécharger vos fichiers."
        );

        // Nettoyer l'URL
        const newUrl =
          window.location.pathname +
          window.location.search.replace(/[?&]payment_status=success/, "");
        window.history.replaceState({}, document.title, newUrl);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

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
    const startTime = Date.now();
    try {
      // Vérifier que les données nécessaires sont présentes
      if (!transfer?.fileTransfer?.id) {
        throw new Error("ID de transfert manquant");
      }
      if (!fileId) {
        throw new Error("ID de fichier manquant");
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      // S'assurer que l'URL se termine par un slash
      const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;

      // Demander l'autorisation de téléchargement au serveur
      const authResponse = await fetch(
        `${baseUrl}api/transfers/${transfer?.fileTransfer?.id}/authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId,
            email: "anonymous@user.com", // Email non important maintenant
          }),
        }
      );

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('Erreur d\'autorisation (downloadFile):', {
          status: authResponse.status,
          statusText: authResponse.statusText,
          url: authResponse.url,
          errorText,
          transferId: transfer?.fileTransfer?.id,
          fileId
        });
        throw new Error(`Erreur d'autorisation: ${authResponse.status} - ${errorText}`);
      }

      const authData = await authResponse.json();

      if (!authData.success) {
        if (authData.requiresPayment) {
          toast.error("Un paiement est requis pour télécharger ce fichier.");
          return;
        }
        throw new Error(authData.error || "Autorisation refusée");
      }

      // Utiliser l'URL sécurisée fournie par le serveur
      const downloadInfo = authData.downloads.find((d) => d.fileId === fileId);
      if (!downloadInfo) {
        throw new Error("URL de téléchargement non trouvée");
      }

      // Utiliser la route proxy du serveur pour un vrai téléchargement
      const proxyUrl = `${baseUrl}api/files/download/${transfer?.fileTransfer?.id}/${fileId}`;

      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = fileName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Marquer le téléchargement comme terminé
      if (downloadInfo.downloadEventId) {
        await fetch(
          `${baseUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ duration: Date.now() - startTime }),
          }
        );
      }

      toast.success("Fichier téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error(error.message || "Erreur lors du téléchargement du fichier");
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour télécharger tous les fichiers
  const downloadAllFiles = async () => {
    setIsDownloading(true);
    const startTime = Date.now();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      // Demander l'autorisation de téléchargement pour tous les fichiers
      const authResponse = await fetch(
        `${apiUrl}api/transfers/${transfer?.fileTransfer?.id}/authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "anonymous@user.com", // Email non important maintenant
          }),
        }
      );

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Erreur d'autorisation: ${authResponse.status}`);
      }

      const authData = await authResponse.json();

      if (!authData.success) {
        if (authData.requiresPayment) {
          toast.error("Un paiement est requis pour télécharger ces fichiers.");
          return;
        }
        throw new Error(authData.error || "Autorisation refusée");
      }

      // Si un seul fichier, télécharger directement
      if (authData.downloads.length === 1) {
        const downloadInfo = authData.downloads[0];
        const response = await fetch(downloadInfo.downloadUrl);

        if (!response.ok) {
          throw new Error("Erreur lors du téléchargement");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadInfo.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Plusieurs fichiers : utiliser l'endpoint ZIP existant avec vérification
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
      }

      // Marquer les téléchargements comme terminés
      const duration = Date.now() - startTime;
      for (const downloadInfo of authData.downloads) {
        if (downloadInfo.downloadEventId) {
          await fetch(
            `${apiUrl}/api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ duration }),
            }
          );
        }
      }

      toast.success("Fichiers téléchargés avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error(
        error.message || "Erreur lors du téléchargement des fichiers"
      );
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
      <div className="container mx-auto max-w-full px-10 py-20">
        {/* Main Card Skeleton */}
        <Skeleton className="h-full w-1/2 mb-2" />
        <Skeleton className="h-full w-1/2" />
        {/* <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Skeleton className="h-4 w-16 mx-auto mb-2" />
                <Skeleton className="h-6 w-12 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-6 w-16 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-24 mx-auto mb-2" />
                <Skeleton className="h-6 w-8 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card> */}
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
    <div className="flex flex-col lg:flex-row h-screen relative">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-2 relative pt-16 lg:pt-2">
        {/* Confetti Canvas - limité à la partie gauche */}
        {paymentStatus === "success" && (
          <Confetti
            ref={confettiRef}
            className="absolute right-0 top-0 z-50 w-full h-full pointer-events-none"
          />
        )}
        <div className="mx-auto w-full max-w-xl lg:max-w-xl">
          <div className="mb-8">
            <h1 className="text-xl font-medium mb-2">
              Téléchargez les fichiers partagés avec vous
            </h1>
            <p className="text-sm text-gray-600">
              Accédez aux fichiers qui ont été partagés avec vous de manière sécurisée
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
              <div className="grid grid-cols-1 gap-4">
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
          {Boolean(
            (transfer?.fileTransfer?.isPaymentRequired === true ||
              (transfer?.fileTransfer?.paymentAmount &&
                transfer?.fileTransfer?.paymentAmount > 0)) &&
            !transfer?.fileTransfer?.isPaid
          ) && (
              <>
                <Separator />
                <Card className="mb-6 border-none shadow-none">
                  <CardContent className="p-0">
                    <div className="flex item-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-normal">Paiement requis</h3>
                        <p className="mb-4 text-sm">
                          Ce transfert nécessite un paiement de{" "}
                          {transfer?.fileTransfer?.paymentAmount}{" "}
                          {transfer?.fileTransfer?.paymentCurrency}
                        </p>
                      </div>
                      <Button
                        className="cursor-pointer bg-[#5b4fff]/80 hover:bg-[#5b4fff]/90"
                        onClick={() =>
                          initiatePayment(transfer?.fileTransfer?.id)
                        }
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Redirection..." : "Procéder au paiement"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Separator />
              </>
            )}
          {/* ici tu fais les mdifs */}
          <Card className="shadow-none border-none">
            <CardHeader className="p-0">
              <CardTitle className="flex flex-col lg:flex-row lg:items-center font-normal lg:justify-between gap-4">
                <span className="flex items-center space-x-2">
                  <span>
                    Fichiers ({transfer?.fileTransfer?.files?.length || 0})
                  </span>
                  <div className="w-2 h-2 bg-[#5b4fff]/20 rounded-full"></div>
                </span>
                {transfer?.fileTransfer?.files?.length > 1 && !isExpired && (
                  <Button
                    onClick={downloadAllFiles}
                    disabled={
                      isDownloading ||
                      ((transfer?.fileTransfer?.isPaymentRequired === true ||
                        (transfer?.fileTransfer?.paymentAmount &&
                          transfer?.fileTransfer?.paymentAmount > 0)) &&
                        !transfer?.fileTransfer?.isPaid)
                    }
                    className="font-normal cursor-pointer bg-[#5b4fff]/80 border-[#5b4fff]/80 hover:bg-[#5b4fff]/90 disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
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
                  {transfer?.fileTransfer?.files.map((file, index) => {
                    // Vérifier si paiement requis ET si l'utilisateur n'a pas encore payé
                    const isPaymentRequired =
                      (transfer?.fileTransfer?.isPaymentRequired === true ||
                        (transfer?.fileTransfer?.paymentAmount &&
                          transfer?.fileTransfer?.paymentAmount > 0)) &&
                      !transfer?.fileTransfer?.isPaid;

                    return (
                      <div
                        key={file.id || index}
                        className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
                          isPaymentRequired
                            ? "border-gray-200 bg-gray-50/50"
                            : "border-gray-200 hover:bg-[#5b4fff]/5 hover:border-[#5b4fff]/20"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isPaymentRequired
                                ? "bg-gray-100"
                                : "bg-[#5b4fff]/10"
                            }`}
                          >
                            <File
                              size={16}
                              className={
                                isPaymentRequired
                                  ? "text-gray-400"
                                  : "text-[#5b4fff]/70"
                              }
                            />
                          </div>
                          <div>
                            <p
                              className={`font-normal text-sm ${
                                isPaymentRequired
                                  ? "text-gray-400"
                                  : "text-gray-900"
                              }`}
                            >
                              {file.originalName}
                            </p>
                            <p
                              className={`text-xs font-normal ${
                                isPaymentRequired
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatFileSize(file.size)} • {file.mimeType}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            downloadFile(file.id, file.originalName)
                          }
                          disabled={
                            isDownloading || isExpired || isPaymentRequired
                          }
                          size="sm"
                          className={`${
                            isPaymentRequired
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-[#5b4fff]/10 hover:text-[#5b4fff]"
                          }`}
                        >
                          {isPaymentRequired ? (
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          ) : (
                            <Download size={16} className="cursor-pointer" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
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
      <div className="hidden lg:flex w-1/2 p-3 items-center min-h-screen justify-center">
        <div
          className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center relative"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
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
