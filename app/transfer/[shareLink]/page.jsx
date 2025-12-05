"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_TRANSFER_BY_LINK } from "@/app/dashboard/outils/transferts-fichiers/graphql/mutations";
import { useStripePayment } from "@/src/hooks/useStripePayment";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Download,
  Eye,
  FileIcon,
  Clock,
  Files,
  ArrowDown,
  Euro,
  LoaderCircle,
  X,
} from "lucide-react";
import Image from "next/image";

// Composants séparés
import { PasswordModal, FilePreviewDrawer, PaymentModal } from "./components";
import CircularProgress from "@/src/components/ui/circular-progress";

export default function TransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareLink = params.shareLink;
  const accessKey = searchParams.get("key");
  const paymentStatus = searchParams.get("payment_status");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);

  // Ref pour annuler le téléchargement
  const downloadAbortRef = useRef(null);

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

  // Fonction pour annuler le téléchargement
  const cancelDownload = () => {
    if (downloadAbortRef.current) {
      downloadAbortRef.current.abort();
      downloadAbortRef.current = null;
    }
  };

  // Fonction pour télécharger un fichier avec progression
  const downloadFile = async (fileId, fileName, fileSize = 0) => {
    // Créer un nouvel AbortController
    downloadAbortRef.current = new AbortController();

    setIsDownloading(true);
    setDownloadingFileId(fileId);
    setDownloadProgress(0);
    const startTime = Date.now();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      // Demander l'autorisation de téléchargement au serveur
      const authResponse = await fetch(
        `${apiUrl}api/transfers/${transfer?.fileTransfer?.id}/authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId,
            email: `guest-${Date.now()}@newbi.fr`,
          }),
          signal: downloadAbortRef.current.signal,
        }
      );

      if (!authResponse.ok) {
        throw new Error(`Erreur d'autorisation: ${authResponse.status}`);
      }

      const authData = await authResponse.json();

      if (!authData.success) {
        if (authData.requiresPayment) {
          toast.error("Un paiement est requis pour télécharger ce fichier.");
          return;
        }
        throw new Error(authData.error || "Autorisation refusée");
      }

      const downloadInfo = authData.downloads.find((d) => d.fileId === fileId);
      if (!downloadInfo) {
        throw new Error("URL de téléchargement non trouvée");
      }

      // Téléchargement avec streaming et progression
      const response = await fetch(downloadInfo.downloadUrl, {
        signal: downloadAbortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const contentLength = response.headers.get("content-length");
      const totalSize = contentLength ? parseInt(contentLength, 10) : fileSize;

      // Détecter si on est sur mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Si on peut streamer avec progression (desktop uniquement pour éviter "load failed" sur mobile)
      if (totalSize && response.body && !isMobile) {
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // Mettre à jour la progression
          const progress = Math.round((receivedLength / totalSize) * 100);
          setDownloadProgress(progress);
        }

        // Assembler les chunks en blob
        const blob = new Blob(chunks);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Mobile ou fallback: téléchargement direct via lien (évite "load failed")
        // Ouvrir directement l'URL de téléchargement
        window.open(downloadInfo.downloadUrl, "_blank");
      }

      // Marquer le téléchargement comme terminé
      if (downloadInfo.downloadEventId) {
        fetch(
          `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration: Date.now() - startTime }),
          }
        ).catch(() => {}); // Fire and forget
      }

      toast.success("Fichier téléchargé avec succès");
    } catch (error) {
      // Si c'est une annulation, ne pas afficher d'erreur
      if (error.name === "AbortError") {
        toast.info("Téléchargement annulé");
        return;
      }
      console.error("Erreur lors du téléchargement:", error);
      toast.error(error.message || "Erreur lors du téléchargement du fichier");
    } finally {
      setIsDownloading(false);
      setDownloadingFileId(null);
      setDownloadProgress(0);
      downloadAbortRef.current = null;
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
            email: `guest-${Date.now()}@newbi.fr`, // Email unique pour traçabilité
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
        // Plusieurs fichiers : utiliser la route API Next.js pour créer un ZIP
        const fileIds = authData.downloads.map((d) => d.fileId).join(",");
        const response = await fetch(
          `/api/transfer/download-all?shareLink=${shareLink}&accessKey=${accessKey}&transferId=${transfer?.fileTransfer?.id}&fileIds=${fileIds}`
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
            `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
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

  // Fonction pour ouvrir la prévisualisation
  const openPreview = (file, index = 0) => {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");
    const previewUrl = `${apiUrl}/api/files/preview/${transfer?.fileTransfer?.id}/${file.fileId || file.id || file._id}`;
    setPreviewFile({
      ...file,
      previewUrl,
      transferId: transfer?.fileTransfer?.id,
    });
    setPreviewFileIndex(index);
  };

  // Fonction pour naviguer entre les fichiers dans le drawer
  const handlePreviewNavigate = (newIndex) => {
    const files = transfer?.fileTransfer?.files || [];
    if (newIndex >= 0 && newIndex < files.length) {
      openPreview(files[newIndex], newIndex);
    }
  };

  // Fonction pour télécharger un fichier individuel (depuis le drawer)
  const downloadSingleFile = async (file) => {
    const fileId = file.fileId || file.id || file._id;
    // Utiliser la fonction principale avec progression
    await downloadFile(fileId, file.originalName, file.size);
    setPreviewFile(null);
  };

  // Vérifier si le transfert nécessite un mot de passe et s'il n'est pas encore vérifié
  const needsPasswordVerification =
    !!transfer?.fileTransfer?.passwordProtected && !isPasswordVerified;

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

  // Calculer si paiement requis
  const isPaymentRequired = !!(
    (transfer?.fileTransfer?.isPaymentRequired === true ||
      (transfer?.fileTransfer?.paymentAmount &&
        transfer?.fileTransfer?.paymentAmount > 0)) &&
    !transfer?.fileTransfer?.isPaid
  );

  // Calculer la taille totale des fichiers
  const totalSize = transfer?.fileTransfer?.files?.reduce(
    (acc, file) => acc + (file.size || 0),
    0
  );

  // Formater la taille
  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Formater la date d'expiration
  const formatExpiryDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Vérifier si un fichier peut être prévisualisé
  const canPreview = (file) => {
    if (!transfer?.fileTransfer?.allowPreview) return false;
    const previewableTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    const ext = (file.originalName || "").split(".").pop()?.toLowerCase();
    const previewableExts = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
    return (
      previewableTypes.includes(file.mimeType) || previewableExts.includes(ext)
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Modal de mot de passe */}
      {needsPasswordVerification && (
        <PasswordModal
          transferId={transfer?.fileTransfer?.id}
          onPasswordVerified={() => setIsPasswordVerified(true)}
        />
      )}

      {/* Drawer de prévisualisation */}
      <FilePreviewDrawer
        file={previewFile}
        files={transfer?.fileTransfer?.files || []}
        currentIndex={previewFileIndex}
        onClose={() => setPreviewFile(null)}
        onDownload={downloadSingleFile}
        onNavigate={handlePreviewNavigate}
      />

      {/* Modal de paiement */}
      {isPaymentRequired && (
        <PaymentModal
          amount={transfer?.fileTransfer?.paymentAmount}
          currency={transfer?.fileTransfer?.paymentCurrency}
          onPay={() => initiatePayment(transfer?.fileTransfer?.id)}
          isProcessing={isProcessing}
        />
      )}

      {/* Panneau gauche - Fond gris avec image */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8F8F8] items-center justify-start relative">
        {/* Logo en haut à gauche */}
        <div className="absolute top-2 left-2">
          <Image
            src="/newbiLetter.png"
            alt="Newbi"
            width={100}
            height={32}
            priority
          />
        </div>
        <Image
          src="/fondTransfer.png"
          alt="Newbi Transfer"
          width={650}
          height={650}
          className="object-contain"
          priority
        />
      </div>

      {/* Panneau droit - Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 lg:px-8 lg:py-10">
        {/* Logo mobile */}
        <div className="lg:hidden absolute top-4 left-4">
          <Image
            src="/newbiLetter.png"
            alt="Newbi"
            width={100}
            height={32}
            priority
          />
        </div>

        {/* Card principale */}
        <Card
          className="w-full mx-auto rounded-3xl shadow-md p-0"
          style={{ maxWidth: 320 }}
        >
          {isExpired ? (
            /* Message d'expiration */
            <div className="px-5 py-8 text-center">
              <div className="rounded-full w-44 h-44 mx-auto border-8 border-gray-300 flex items-center justify-center mb-6">
                <Clock className="w-20 h-20 text-gray-300" />
              </div>
              <h1 className="text-2xl font-light text-gray-800">
                Transfert expiré
              </h1>
              <p className="text-xs text-gray-500 mt-2">
                Ce lien n'est plus disponible
              </p>
            </div>
          ) : isPaymentRequired ? null : (
            /* Contenu principal */
            <>
              {/* Preview de la première image OU Progress pendant téléchargement */}
              {transfer?.fileTransfer?.files?.[0] && (
                <div className="mx-4 mt-4 h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                  {isDownloading ? (
                    /* Afficher la progression pendant le téléchargement */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#5a50ff]/5 to-[#5a50ff]/10 relative">
                      <CircularProgress
                        value={downloadProgress}
                        size={140}
                        strokeWidth={8}
                        showLabel
                        labelClassName="text-lg font-bold"
                        renderLabel={(progress) => `${Math.round(progress)}%`}
                        className="stroke-[#5a50ff]/20"
                        progressClassName="stroke-[#5a50ff]"
                      />
                      {/* Bouton annuler discret */}
                      <button
                        onClick={cancelDownload}
                        className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {[
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "image/webp",
                      ].includes(
                        transfer?.fileTransfer?.files?.[0]?.mimeType
                      ) ||
                      ["jpg", "jpeg", "png", "gif", "webp"].includes(
                        transfer?.fileTransfer?.files?.[0]?.originalName
                          ?.split(".")
                          .pop()
                          ?.toLowerCase()
                      ) ? (
                        <img
                          src={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "")}/api/files/preview/${transfer?.fileTransfer?.id}/${transfer?.fileTransfer?.files?.[0]?.fileId || transfer?.fileTransfer?.files?.[0]?.id}`}
                          alt={transfer?.fileTransfer?.files?.[0]?.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileIcon className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {/* Bouton preview au centre */}
                      <button
                        onClick={() =>
                          openPreview(transfer?.fileTransfer?.files?.[0], 0)
                        }
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-gray-700" />
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Titre */}
              <div className="w-full px-5 text-center py-6">
                <h1 className="text-xl font-medium text-gray-800">
                  Vos fichiers sont prêts
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Expire le{" "}
                  {formatExpiryDate(transfer?.fileTransfer?.expiryDate)}
                </p>
              </div>

              {/* Liste des fichiers */}
              <ul className="max-h-40 overflow-y-auto">
                {transfer?.fileTransfer?.files?.map((file, index) => (
                  <li
                    key={file.id || index}
                    className="w-full px-5 py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="w-full flex items-center">
                      <div className="flex-grow min-w-0">
                        <h3 className="text-sm text-gray-800 truncate">
                          {file.originalName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatSize(file.size)}
                          {file.mimeType &&
                            !file.mimeType.includes("octet-stream") && (
                              <> • {file.mimeType?.split("/")[1]}</>
                            )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {canPreview(file) && (
                          <button
                            onClick={() => openPreview(file, index)}
                            className="p-2 text-gray-400 hover:text-[#5a50ff] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            downloadFile(
                              file.id || file.fileId,
                              file.originalName,
                              file.size
                            )
                          }
                          disabled={isDownloading}
                          className={`p-2 transition-colors cursor-pointer ${
                            isDownloading
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-400 hover:text-[#5a50ff]"
                          }`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Bouton télécharger */}
              <div className="w-full px-5 py-5 text-center">
                <Button
                  onClick={downloadAllFiles}
                  disabled={isDownloading}
                  className="text-white px-10 w-full rounded-xl"
                >
                  {isDownloading ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : transfer?.fileTransfer?.files?.length > 1 ? (
                    "Tout télécharger"
                  ) : (
                    "Télécharger"
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
