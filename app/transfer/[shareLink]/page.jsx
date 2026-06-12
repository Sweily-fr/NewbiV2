"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_TRANSFER_BY_LINK } from "@/app/dashboard/outils/transferts-fichiers/graphql/mutations";
import { useStripePayment } from "@/src/hooks/useStripePayment";
import { useZipPreview } from "@/src/hooks/useZipPreview";
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
  Lock,
  X,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import JSZip from "jszip";

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
  const [thumbnailError, setThumbnailError] = useState(false);

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
          "Paiement effectué avec succès! Vous pouvez maintenant télécharger vos fichiers.",
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
  const transferFiles = transfer?.fileTransfer?.files || [];

  // Détection d'un transfert mono-ZIP (créé depuis documents partagés).
  // On parse alors le ZIP côté client pour exposer ses entrées comme des fichiers.
  const zipContainer = useMemo(() => {
    if (transferFiles.length !== 1) return null;
    const f = transferFiles[0];
    const isZip =
      f?.mimeType === "application/zip" ||
      /\.zip$/i.test(f?.originalName || "");
    return isZip ? f : null;
  }, [transferFiles]);

  const zipPreviewUrl = useMemo(() => {
    if (!zipContainer || !transfer?.fileTransfer?.id) return null;
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");
    return `${apiUrl}/api/files/preview/${transfer.fileTransfer.id}/${zipContainer.fileId || zipContainer.id}`;
  }, [zipContainer, transfer?.fileTransfer?.id]);

  const {
    loading: zipLoading,
    error: zipError,
    entries: zipEntries,
    blobUrls: zipBlobUrls,
    tooLarge: zipTooLarge,
    extractBlob: extractZipBlob,
  } = useZipPreview({
    enabled: !!zipContainer,
    zipUrl: zipPreviewUrl,
  });

  // displayFiles: entrées extraites du ZIP, sinon fichiers réels du transfert
  const displayFiles = useMemo(() => {
    if (!zipContainer) return transferFiles;
    return zipEntries.map((e) => ({
      id: e.path,
      path: e.path,
      originalName: e.name,
      mimeType: e.mimeType,
      size: e.size,
      isZipEntry: true,
    }));
  }, [zipContainer, zipEntries, transferFiles]);

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
        },
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

      // Détecter si on est sur mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Marquer le téléchargement comme terminé AVANT la redirection :
        // la navigation annule les fetch en cours sur mobile (keepalive pour
        // que la requête survive au changement de page)
        if (downloadInfo.downloadEventId) {
          fetch(
            `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              keepalive: true,
              body: JSON.stringify({
                duration: Date.now() - startTime,
                isLastFile: true,
              }),
            },
          ).catch(() => {}); // Fire and forget
        }

        // Laisser le navigateur mobile gérer le téléchargement nativement
        window.location.href = downloadInfo.downloadUrl;
        toast.info("Téléchargement en cours...");
        return;
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

      // Si on peut streamer avec progression
      if (totalSize && response.body) {
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
        // Fallback: rediriger vers l'URL de téléchargement
        window.location.href = downloadInfo.downloadUrl;
      }

      // Marquer le téléchargement comme terminé
      if (downloadInfo.downloadEventId) {
        fetch(
          `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
              duration: Date.now() - startTime,
              isLastFile: true,
            }),
          },
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
        },
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

      // Bloquer tous les fichiers si filigrane actif
      if (hasWatermark) {
        toast.error(
          "Les fichiers de ce transfert sont protégés par un filigrane et ne peuvent pas être téléchargés.",
        );
        return;
      }
      const files = allFiles;

      // Si aucun fichier téléchargeable
      if (files.length === 0) {
        toast.error("Aucun fichier téléchargeable disponible.");
        return;
      }

      const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

      // Filtrer les téléchargements autorisés pour exclure les images si filigrane
      const downloadableFileIds = files.map((f) => f.id);
      const filteredDownloads = authData.downloads.filter((d) =>
        downloadableFileIds.includes(d.fileId),
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

        // Marquer les téléchargements comme terminés AVANT la redirection :
        // la navigation annule les fetch en cours sur mobile (keepalive pour
        // que les requêtes survivent au changement de page)
        const mobileDuration = Date.now() - startTime;
        filteredDownloads.forEach((downloadInfo, i) => {
          if (downloadInfo.downloadEventId) {
            fetch(
              `${apiUrl}api/transfers/download-event/${downloadInfo.downloadEventId}/complete`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                keepalive: true,
                body: JSON.stringify({
                  duration: mobileDuration,
                  isLastFile: i === filteredDownloads.length - 1,
                }),
              },
            ).catch(() => {}); // Fire and forget
          }
        });

        // Rediriger vers l'URL - le navigateur mobile va télécharger le fichier
        window.location.href = downloadUrl;

        // Sur mobile, le téléchargement est géré par le navigateur
        toast.info("Téléchargement en cours...");
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      } else {
        // Desktop : télécharger tous les fichiers et créer un ZIP
        const zip = new JSZip();
        let totalDownloaded = 0;

        for (let i = 0; i < filteredDownloads.length; i++) {
          const downloadInfo = filteredDownloads[i];
          const file = files.find((f) => f.id === downloadInfo.fileId);
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
              // Réserver les derniers 5% pour la génération du ZIP
              const globalProgress = Math.round(
                ((totalDownloaded + receivedLength) / totalSize) * 95,
              );
              setDownloadProgress(Math.min(globalProgress, 95));
            }

            totalDownloaded += actualFileSize;

            const blob = new Blob(chunks);
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(downloadInfo.fileName, arrayBuffer);
          } else {
            // Fallback : télécharger sans streaming
            const response2 = await fetch(downloadInfo.downloadUrl, {
              signal: downloadAbortRef.current.signal,
            });
            const blob = await response2.blob();
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(downloadInfo.fileName, arrayBuffer);
            totalDownloaded += fileSize;
            setDownloadProgress(
              Math.min(Math.round((totalDownloaded / totalSize) * 95), 95),
            );
          }
        }

        // Générer le ZIP
        setDownloadProgress(96);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        setDownloadProgress(100);

        // Télécharger le ZIP
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${transfer?.fileTransfer?.title || "transfert"}.zip`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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
            },
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
        error.message || "Erreur lors du téléchargement des fichiers",
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
    // Entrée extraite d'un ZIP: utiliser la blob URL générée côté client
    if (file?.isZipEntry) {
      const previewUrl = zipBlobUrls[file.path] || null;
      setPreviewFile({
        ...file,
        previewUrl,
        transferId: transfer?.fileTransfer?.id,
      });
      setPreviewFileIndex(index);
      return;
    }

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
    if (newIndex >= 0 && newIndex < displayFiles.length) {
      openPreview(displayFiles[newIndex], newIndex);
    }
  };

  // Fonction pour télécharger un fichier individuel (depuis le drawer)
  const downloadSingleFile = async (file) => {
    // Entrée ZIP: extraire côté client
    if (file?.isZipEntry) {
      try {
        const blob = await extractZipBlob(file.path);
        if (!blob) {
          toast.error("Impossible d'extraire ce fichier du ZIP");
          return;
        }
        const typed = new Blob([blob], {
          type: file.mimeType || "application/octet-stream",
        });
        const url = window.URL.createObjectURL(typed);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.originalName || "fichier";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        setPreviewFile(null);
        return;
      } catch (err) {
        console.error("Erreur extraction zip entry:", err);
        toast.error("Erreur lors de l'extraction du fichier");
        return;
      }
    }

    const fileId = file.id || file.fileId || file._id;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-400">Chargement du transfert…</p>
        </div>
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
    0,
  );

  // Prévisualisation explicitement désactivée au niveau du transfert.
  // Exception: les transferts ZIP sont toujours prévisualisables via extraction
  // cliente, donc le flag ne s'applique qu'aux transferts non-ZIP.
  const previewDisabled =
    transfer?.fileTransfer?.allowPreview === false && !zipContainer;

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
    if (file?.mimeType?.startsWith("image/")) return true;
    const ext = (file.originalName || "").split(".").pop()?.toLowerCase();
    return [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "heic",
      "heif",
      "svg",
      "tiff",
    ].includes(ext);
  };

  // Vérifier si un fichier peut être prévisualisé
  const canPreview = (file) => {
    // Pour les entrées ZIP, on autorise la preview dès que la blob URL est prête
    if (file?.isZipEntry) {
      return !!zipBlobUrls[file.path];
    }
    if (!transfer?.fileTransfer?.allowPreview) return false;
    // Vidéos: tout type MIME video/*
    if (file.mimeType?.startsWith("video/")) return true;
    const previewableTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    const ext = (file.originalName || "").split(".").pop()?.toLowerCase();
    const previewableExts = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "pdf",
      "heic",
      "heif",
      "mp4",
      "webm",
      "ogg",
      "ogv",
      "mov",
      "m4v",
      "mkv",
    ];
    return (
      previewableTypes.includes(file.mimeType) || previewableExts.includes(ext)
    );
  };

  // Vérifier si le téléchargement d'un fichier est bloqué (filigrane actif)
  const isDownloadBlocked = (file) => {
    return !!transfer?.fileTransfer?.hasWatermark;
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
        files={displayFiles}
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
          onPay={() => initiatePayment(transfer?.fileTransfer?.id, accessKey)}
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
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 pt-16 pb-6 lg:px-8 lg:py-10">
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
              {/* Carte "Prévisualisation désactivée" quand le transfert
                  a explicitement allowPreview=false (non-ZIP) */}
              {displayFiles?.[0] && previewDisabled && !isDownloading && (
                <div className="mx-4 mt-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <p className="px-4 py-3 text-xs text-gray-500 border-b border-gray-200">
                    Prévisualiser
                  </p>
                  <div className="px-4 py-4 flex items-center gap-3 text-xs text-gray-600">
                    <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>
                      La prévisualisation est désactivée pour ce transfert.
                    </span>
                  </div>
                </div>
              )}

              {/* Preview de la première image OU Progress pendant téléchargement.
                  Quand previewDisabled=true, ce bloc ne s'affiche qu'en cours
                  de téléchargement (pour afficher la progress bar). */}
              {displayFiles?.[0] && (!previewDisabled || isDownloading) && (
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
                      {(() => {
                        const PREVIEWABLE_EXTS = [
                          "jpg",
                          "jpeg",
                          "png",
                          "gif",
                          "webp",
                          "heic",
                          "heif",
                          "bmp",
                          "svg",
                          "tiff",
                          "pdf",
                          "mp4",
                          "webm",
                          "ogg",
                          "ogv",
                          "mov",
                          "m4v",
                          "mkv",
                        ];
                        // Pour un ZIP, on cherche la première entrée prévisualisable
                        // (image/pdf/video) plutôt que la première entrée brute.
                        let thumbFile = displayFiles?.[0];
                        let thumbIndex = 0;
                        if (zipContainer) {
                          const idx = displayFiles.findIndex((f) => {
                            const ext = f?.originalName
                              ?.split(".")
                              ?.pop()
                              ?.toLowerCase();
                            return PREVIEWABLE_EXTS.includes(ext);
                          });
                          if (idx >= 0) {
                            thumbFile = displayFiles[idx];
                            thumbIndex = idx;
                          }
                        }

                        // URL de preview: blob URL pour zip entry, endpoint sinon
                        let previewSrc;
                        if (thumbFile?.isZipEntry) {
                          previewSrc = zipBlobUrls[thumbFile.path] || null;
                        } else if (thumbFile) {
                          previewSrc = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "")}/api/files/preview/${transfer?.fileTransfer?.id}/${thumbFile?.fileId || thumbFile?.id}`;
                        }

                        const ext = thumbFile?.originalName
                          ?.split(".")
                          ?.pop()
                          ?.toLowerCase();
                        const isImg =
                          thumbFile?.mimeType?.startsWith("image/") ||
                          [
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "webp",
                            "heic",
                            "heif",
                            "bmp",
                            "svg",
                            "tiff",
                          ].includes(ext);
                        const isPdf =
                          thumbFile?.mimeType === "application/pdf" ||
                          ext === "pdf";
                        const isVid =
                          thumbFile?.mimeType?.startsWith("video/") ||
                          [
                            "mp4",
                            "webm",
                            "ogg",
                            "ogv",
                            "mov",
                            "m4v",
                            "mkv",
                          ].includes(ext);

                        if (zipContainer && zipLoading) {
                          return (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              Lecture de l'archive…
                            </div>
                          );
                        }

                        if (isImg && previewSrc && !thumbnailError) {
                          return (
                            <img
                              src={previewSrc}
                              alt={thumbFile?.originalName}
                              className="w-full h-full object-cover"
                              onError={() => setThumbnailError(true)}
                            />
                          );
                        }
                        if (isVid && previewSrc && !thumbnailError) {
                          return (
                            <video
                              src={previewSrc}
                              className="w-full h-full object-cover pointer-events-none"
                              muted
                              playsInline
                              preload="metadata"
                              onError={() => setThumbnailError(true)}
                            />
                          );
                        }
                        if (isPdf && previewSrc && !thumbnailError) {
                          return (
                            <iframe
                              src={previewSrc}
                              className="w-full h-full pointer-events-none"
                              title={thumbFile?.originalName}
                              onError={() => setThumbnailError(true)}
                            />
                          );
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileIcon className="w-16 h-16 text-gray-300" />
                          </div>
                        );
                      })()}
                      {/* Bouton preview au centre */}
                      <button
                        onClick={() => {
                          // Ouvre le premier fichier prévisualisable
                          let idx = 0;
                          if (zipContainer) {
                            const found = displayFiles.findIndex((f) => {
                              const ext = f?.originalName
                                ?.split(".")
                                ?.pop()
                                ?.toLowerCase();
                              return [
                                "jpg",
                                "jpeg",
                                "png",
                                "gif",
                                "webp",
                                "heic",
                                "heif",
                                "bmp",
                                "svg",
                                "tiff",
                                "pdf",
                                "mp4",
                                "webm",
                                "ogg",
                                "ogv",
                                "mov",
                                "m4v",
                                "mkv",
                              ].includes(ext);
                            });
                            if (found >= 0) idx = found;
                          }
                          openPreview(displayFiles?.[idx], idx);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group cursor-pointer"
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

              {/* Message personnalisé de l'expéditeur */}
              {transfer?.fileTransfer?.message?.trim() && (
                <div className="mx-4 mb-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-[#5a50ff] flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">
                      Message
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                    {transfer.fileTransfer.message}
                  </p>
                </div>
              )}

              {/* Liste des fichiers */}
              {zipContainer && zipLoading ? (
                <div className="w-full px-5 py-3 text-xs text-gray-500">
                  Lecture de l'archive…
                </div>
              ) : zipContainer && zipError ? (
                <div className="w-full px-5 py-3 text-xs text-red-500">
                  Impossible de lire l'archive : {zipError}
                </div>
              ) : zipContainer && zipTooLarge ? (
                <div className="w-full px-5 py-3 text-xs text-gray-500">
                  Archive trop volumineuse pour la prévisualisation.
                </div>
              ) : (
                <ul className="max-h-40 overflow-y-auto">
                  {displayFiles.map((file, index) => (
                    <li
                      key={file.id || file.path || index}
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
                              onClick={() => {
                                if (file.isZipEntry) {
                                  downloadSingleFile(file);
                                } else {
                                  downloadFile(
                                    file.id || file.fileId,
                                    file.originalName,
                                    file.size,
                                  );
                                }
                              }}
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
              )}

              {/* Message filigrane */}
              {transfer?.fileTransfer?.hasWatermark && (
                <div className="w-full px-5 py-2">
                  <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
                    Les fichiers de ce transfert sont protégés par un filigrane
                    et ne peuvent pas être téléchargés.
                  </p>
                </div>
              )}

              {/* Bouton télécharger - masqué si filigrane et uniquement des images */}
              {/* Bouton télécharger - masqué si filigrane actif */}
              {!transfer?.fileTransfer?.hasWatermark && (
                <div className="w-full px-5 py-5 text-center">
                  <Button
                    onClick={downloadAllFiles}
                    disabled={isDownloading}
                    className="text-white px-10 w-full rounded-xl"
                  >
                    {isDownloading ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (transfer?.fileTransfer?.files?.length || 0) > 1 ? (
                      "Tout télécharger"
                    ) : (
                      "Télécharger"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
