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
        // Mobile ou fallback: rediriger vers l'URL de téléchargement
        window.location.href = downloadInfo.downloadUrl;
      }

      // Marquer le téléchargement comme terminé
      if (downloadInfo.downloadEventId) {
        fetch(
          `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              duration: Date.now() - startTime,
              isLastFile: true,
            }),
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
    // Créer un nouvel AbortController
    downloadAbortRef.current = new AbortController();

    setIsDownloading(true);
    setDownloadingFileId("all");
    setDownloadProgress(0);
    const startTime = Date.now();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
          signal: downloadAbortRef.current.signal,
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

      // Calculer la taille totale et récupérer les fichiers
      const allFiles = transfer?.fileTransfer?.files || [];
      const hasWatermark = transfer?.fileTransfer?.hasWatermark;

      // Filtrer les fichiers téléchargeables (exclure les images si filigrane)
      const files = hasWatermark
        ? allFiles.filter((f) => {
            const imageTypes = [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/bmp",
            ];
            const ext = (f.originalName || "").split(".").pop()?.toLowerCase();
            const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
            return !imageTypes.includes(f.mimeType) && !imageExts.includes(ext);
          })
        : allFiles;

      // Si aucun fichier téléchargeable
      if (files.length === 0) {
        toast.error("Aucun fichier téléchargeable disponible.");
        return;
      }

      const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

      // Filtrer les téléchargements autorisés pour exclure les images si filigrane
      const downloadableFileIds = files.map((f) => f.id);
      const filteredDownloads = authData.downloads.filter((d) =>
        downloadableFileIds.includes(d.fileId)
      );

      if (filteredDownloads.length === 0) {
        toast.error("Aucun fichier téléchargeable disponible.");
        return;
      }

      // Sur mobile, rediriger vers l'URL de téléchargement
      if (isMobile) {
        let downloadUrl;

        if (filteredDownloads.length === 1) {
          downloadUrl = filteredDownloads[0].downloadUrl;
        } else {
          const fileIds = filteredDownloads.map((d) => d.fileId).join(",");
          downloadUrl = `/api/transfer/download-all?shareLink=${shareLink}&accessKey=${accessKey}&transferId=${transfer?.fileTransfer?.id}&fileIds=${fileIds}`;
        }

        // Rediriger vers l'URL - le navigateur mobile va télécharger le fichier
        window.location.href = downloadUrl;

        // Sur mobile, le téléchargement est géré par le navigateur
        toast.info("Téléchargement en cours...");
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      } else {
        // Desktop : télécharger les fichiers un par un avec progression globale
        let totalDownloaded = 0;

        for (let i = 0; i < filteredDownloads.length; i++) {
          const downloadInfo = filteredDownloads[i];
          const file = files.find(
            (f) => f.id === downloadInfo.fileId
          );
          const fileSize = file?.size || 0;

          const response = await fetch(downloadInfo.downloadUrl, {
            signal: downloadAbortRef.current.signal,
          });

          if (!response.ok) {
            console.error(`Erreur téléchargement ${downloadInfo.fileName}`);
            continue;
          }

          const contentLength = response.headers.get("content-length");
          const actualFileSize = contentLength
            ? parseInt(contentLength, 10)
            : fileSize;

          if (actualFileSize && response.body) {
            const reader = response.body.getReader();
            const chunks = [];
            let receivedLength = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              receivedLength += value.length;

              // Progression globale : (déjà téléchargé + en cours) / total
              const globalProgress = Math.round(
                ((totalDownloaded + receivedLength) / totalSize) * 100
              );
              setDownloadProgress(globalProgress);
            }

            totalDownloaded += actualFileSize;

            const blob = new Blob(chunks);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadInfo.fileName;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } else {
            // Fallback direct
            totalDownloaded += fileSize;
            setDownloadProgress(
              Math.round((totalDownloaded / totalSize) * 100)
            );
            window.open(downloadInfo.downloadUrl, "_blank");
          }

          // Petit délai entre les téléchargements pour éviter les blocages navigateur
          if (i < filteredDownloads.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }

      // Marquer les téléchargements comme terminés
      const duration = Date.now() - startTime;
      const totalFiles = filteredDownloads.length;
      for (let i = 0; i < totalFiles; i++) {
        const downloadInfo = filteredDownloads[i];
        if (downloadInfo.downloadEventId) {
          const isLastFile = i === totalFiles - 1;
          fetch(
            `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ duration, isLastFile }),
            }
          ).catch(() => {}); // Fire and forget
        }
      }

      toast.success("Fichiers téléchargés avec succès !");
    } catch (error) {
      // Si c'est une annulation, ne pas afficher d'erreur
      if (error.name === "AbortError") {
        toast.info("Téléchargement annulé");
        return;
      }
      console.error("Erreur lors du téléchargement:", error);
      toast.error(
        error.message || "Erreur lors du téléchargement des fichiers"
      );
    } finally {
      setIsDownloading(false);
      setDownloadingFileId(null);
      setDownloadProgress(0);
      downloadAbortRef.current = null;
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

  // Vérifier si un fichier est une image
  const isImageFile = (file) => {
    const imageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];
    const ext = (file.originalName || "").split(".").pop()?.toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    return imageTypes.includes(file.mimeType) || imageExts.includes(ext);
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

  // Vérifier si le téléchargement d'un fichier est bloqué (image avec filigrane)
  const isDownloadBlocked = (file) => {
    return transfer?.fileTransfer?.hasWatermark && isImageFile(file);
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
        hasWatermark={transfer?.fileTransfer?.hasWatermark}
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
          src="/Compresse001.png"
          alt="Newbi Transfer"
          width={750}
          height={750}
          className="object-contain -translate-x-40"
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
                <div
                  className={`mx-4 mt-4 ${isDownloading ? "h-auto" : "h-32"} bg-gray-100 rounded-xl overflow-hidden relative`}
                >
                  {isDownloading ? (
                    /* Afficher la progression pendant le téléchargement */
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-4">
                      <CircularProgress
                        value={downloadProgress}
                        size={120}
                        strokeWidth={10}
                        showLabel
                        labelClassName="text-sm font-bold"
                        renderLabel={(progress) => `${Math.round(progress)}%`}
                        className="stroke-[#5a50ff]/25"
                        progressClassName="stroke-[#5a50ff]"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-[#5a50ff]">
                          Téléchargement...
                        </p>
                        <span className="text-[10px] text-gray-300">•</span>
                        <button
                          onClick={cancelDownload}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Annuler
                        </button>
                      </div>
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
                        {!isDownloadBlocked(file) && (
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
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Message filigrane */}
              {transfer?.fileTransfer?.hasWatermark && (
                <div className="w-full px-5 py-2">
                  <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
                    Les images de ce transfert sont protégées par un filigrane
                    et ne peuvent pas être téléchargées.
                  </p>
                </div>
              )}

              {/* Bouton télécharger - masqué si filigrane et uniquement des images */}
              {(() => {
                const files = transfer?.fileTransfer?.files || [];
                const hasWatermark = transfer?.fileTransfer?.hasWatermark;
                const downloadableFiles = hasWatermark
                  ? files.filter((f) => !isImageFile(f))
                  : files;
                const allBlocked =
                  hasWatermark && downloadableFiles.length === 0;

                // Ne pas afficher le bouton si tous les fichiers sont bloqués
                if (allBlocked) {
                  return null;
                }

                return (
                  <div className="w-full px-5 py-5 text-center">
                    <Button
                      onClick={downloadAllFiles}
                      disabled={isDownloading}
                      className="text-white px-10 w-full rounded-xl"
                    >
                      {isDownloading ? (
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                      ) : downloadableFiles.length > 1 ? (
                        "Tout télécharger"
                      ) : (
                        "Télécharger"
                      )}
                    </Button>
                  </div>
                );
              })()}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
