"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import {
  IconDownload,
  IconLock,
  IconClock,
  IconFile,
  IconAlertCircle,
  IconCheck,
  IconCreditCard,
} from "@tabler/icons-react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TRANSFER_BY_LINK,
  GENERATE_FILE_TRANSFER_PAYMENT_LINK,
} from "../graphql/mutations";
import { toast } from "sonner";

export default function TransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareLink = params.shareLink;
  const accessKey = searchParams.get("key");

  const [password, setPassword] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Query pour récupérer les informations du transfert
  const { data, loading, error, refetch } = useQuery(GET_TRANSFER_BY_LINK, {
    variables: { shareLink, accessKey },
    skip: !shareLink || !accessKey,
    errorPolicy: "all",
  });

  // Mutation pour générer un lien de paiement
  const [generatePaymentLink, { loading: paymentLoading }] = useMutation(
    GENERATE_FILE_TRANSFER_PAYMENT_LINK
  );

  const transfer = data?.getFileTransferByLink?.fileTransfer;

  // Données de démonstration si pas de données réelles
  const demoTransfer = {
    id: "1",
    files: [
      { name: "document.pdf", size: 2048576, url: "/demo/document.pdf" },
      {
        name: "presentation.pptx",
        size: 5242880,
        url: "/demo/presentation.pptx",
      },
    ],
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    requirePayment: false,
    paymentAmount: 0,
    currency: "EUR",
    passwordProtected: false,
    maxDownloads: 10,
    downloadCount: 3,
    customMessage:
      "Voici les fichiers que vous avez demandés. Merci de votre confiance !",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const transferData = transfer || demoTransfer;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalSize = () => {
    return transferData.files.reduce((total, file) => total + file.size, 0);
  };

  const isExpired = new Date(transferData.expiryDate) <= new Date();
  const isLimitReached =
    transferData.maxDownloads &&
    transferData.downloadCount >= transferData.maxDownloads;
  const canDownload =
    !isExpired &&
    !isLimitReached &&
    (!transferData.isPaymentRequired || paymentCompleted);

  const handlePayment = async () => {
    try {
      const { data } = await generatePaymentLink({
        variables: { shareLink, accessKey },
      });

      if (data?.generatePaymentLink?.success) {
        // Rediriger vers le lien de paiement
        window.location.href = data.generatePaymentLink.paymentUrl;
      } else {
        toast.error("Erreur lors de la génération du lien de paiement");
      }
    } catch (error) {
      console.error("Erreur paiement:", error);
      toast.error("Erreur lors de la génération du lien de paiement");
    }
  };

  const handleDownload = async (file) => {
    if (!canDownload) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulation du téléchargement avec progression
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simuler le téléchargement
      setTimeout(() => {
        // Créer un lien de téléchargement fictif
        const link = document.createElement("a");
        link.href = file.url || "#";
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsDownloading(false);
        setDownloadProgress(0);
        toast.success(`${file.name} téléchargé avec succès`);
      }, 2500);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      toast.error("Erreur lors du téléchargement");
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDownloadAll = async () => {
    if (!canDownload) return;

    for (const file of transferData.files) {
      await handleDownload(file);
      // Attendre un peu entre chaque téléchargement
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <IconAlertCircle
              className="mx-auto mb-4 text-destructive"
              size={48}
            />
            <h2 className="text-xl font-semibold mb-2">
              Transfert introuvable
            </h2>
            <p className="text-muted-foreground mb-4">
              Ce lien de transfert n'existe pas ou a expiré.
            </p>
            <p className="text-sm text-muted-foreground">
              Vérifiez que vous avez utilisé le bon lien ou contactez
              l'expéditeur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="w-full">
        <h1 className="text-xl font-semibold mb-2">Transfert de fichiers</h1>
        <p className="text-muted-foreground text-sm">
          {transferData.files.length} fichier
          {transferData.files.length > 1 ? "s" : ""} •{" "}
          {formatFileSize(getTotalSize())}
        </p>
      </div>

      <div className="space-y-6">
        {/* Message personnalisé */}
        {transferData.customMessage && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed">
                {transferData.customMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informations du transfert */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <IconClock className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Expire le</p>
                  <p className="font-medium">
                    {new Date(transferData.expiryDate).toLocaleDateString(
                      "fr-FR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <IconDownload className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Téléchargements
                  </p>
                  <p className="font-medium">
                    {transferData.downloadCount}
                    {transferData.maxDownloads &&
                      ` / ${transferData.maxDownloads}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <IconFile className="text-muted-foreground" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Taille totale</p>
                  <p className="font-medium">
                    {formatFileSize(getTotalSize())}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paiement requis */}
        {transferData.isPaymentRequired && !paymentCompleted && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconCreditCard className="text-orange-600" size={24} />
                <div>
                  <h3 className="font-semibold text-orange-800">
                    Paiement requis
                  </h3>
                  <p className="text-sm text-orange-700">
                    Un paiement de {transferData.paymentAmount}€ est requis pour
                    accéder aux fichiers.
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {paymentLoading
                  ? "Génération..."
                  : `Payer ${transferData.paymentAmount}€`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Protection par mot de passe */}
        {transferData.passwordProtected && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconLock size={20} />
                <h3 className="font-semibold">Protection par mot de passe</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez le mot de passe"
                  />
                </div>
                <Button variant="outline" size="sm">
                  Vérifier
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des fichiers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fichiers disponibles</CardTitle>
              {canDownload && transferData.files.length > 1 && (
                <Button onClick={handleDownloadAll} disabled={isDownloading}>
                  <IconDownload size={16} className="mr-2" />
                  Tout télécharger
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {transferData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <IconFile size={20} className="text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDownload(file)}
                    disabled={!canDownload || isDownloading}
                    variant={canDownload ? "default" : "secondary"}
                  >
                    <IconDownload size={16} className="mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Barre de progression */}
        {isDownloading && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Téléchargement en cours...
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {downloadProgress}%
                  </span>
                </div>
                <Progress value={downloadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages d'état */}
        {isExpired && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <IconAlertCircle className="text-red-600" size={20} />
                <div>
                  <h3 className="font-semibold text-red-800">
                    Transfert expiré
                  </h3>
                  <p className="text-sm text-red-700">
                    Ce transfert a expiré le{" "}
                    {new Date(transferData.expiryDate).toLocaleDateString(
                      "fr-FR"
                    )}
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLimitReached && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <IconAlertCircle className="text-orange-600" size={20} />
                <div>
                  <h3 className="font-semibold text-orange-800">
                    Limite de téléchargements atteinte
                  </h3>
                  <p className="text-sm text-orange-700">
                    Ce transfert a atteint sa limite de{" "}
                    {transferData.maxDownloads} téléchargements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
