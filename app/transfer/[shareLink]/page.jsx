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

// Composants séparés
import {
  PasswordModal,
  FilePreviewDrawer,
  PaymentModal,
  PdfPreview,
} from "./components";

// Déclenche un téléchargement natif : la réponse étant une pièce jointe
// (Content-Disposition: attachment), le navigateur garde la page affichée
// et lance son propre téléchargement. Ne PAS utiliser d'iframe caché :
// iOS Safari ignore silencieusement les téléchargements qui en proviennent.
const triggerMobileDownload = (url) => {
  window.location.href = url;
};

// Remet au navigateur un fichier téléchargé par la page. Sur iOS, la
// confirmation d'enregistrement apparaît à ce moment-là (mécanisme du
// système, elle ne peut pas être affichée avant).
const saveBlobAsFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "fichier";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Ne pas révoquer tout de suite : iOS a besoin de l'URL le temps
  // d'enregistrer le fichier
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
};

// Au-delà de cette taille, garder le fichier en mémoire dans la page peut
// faire planter le navigateur sur certains téléphones : on délègue au
// téléchargement natif (progression affichée par le navigateur)
const IN_PAGE_SINGLE_FILE_LIMIT = 400 * 1024 * 1024;

// Nombre de fichiers téléchargés simultanément par « Tout télécharger »
const BULK_CONCURRENCY = 3;

// --- Écriture ZIP « store » (sans compression) par référence de Blobs ---
// Permet d'assembler l'archive finale sans jamais recopier les données :
// les Blobs téléchargés (stockés sur disque par le navigateur) sont
// référencés tels quels entre les en-têtes ZIP.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32Append = (crc, bytes) => {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

// entries: [{ name, size, crc, blob }] → Blob ZIP (limites zip32 vérifiées
// par l'appelant : < 4 Go par fichier et au total, < 65535 entrées)
const buildStoreZip = (entries) => {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true); // signature
    header.setUint16(4, 20, true); // version requise
    header.setUint16(6, 0x0800, true); // flags: noms UTF-8
    header.setUint16(8, 0, true); // méthode: store
    header.setUint16(10, 0, true); // heure DOS
    header.setUint16(12, 0x21, true); // date DOS (1980-01-01)
    header.setUint32(14, entry.crc, true);
    header.setUint32(18, entry.size, true); // taille compressée
    header.setUint32(22, entry.size, true); // taille originale
    header.setUint16(26, nameBytes.length, true);
    header.setUint16(28, 0, true); // extra

    parts.push(header.buffer, nameBytes, entry.blob);
    central.push({ entry, nameBytes, offset });
    offset += 30 + nameBytes.length + entry.size;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const { entry, nameBytes, offset: localOffset } of central) {
    const rec = new DataView(new ArrayBuffer(46));
    rec.setUint32(0, 0x02014b50, true);
    rec.setUint16(4, 20, true); // version créateur
    rec.setUint16(6, 20, true); // version requise
    rec.setUint16(8, 0x0800, true);
    rec.setUint16(10, 0, true);
    rec.setUint16(12, 0, true);
    rec.setUint16(14, 0x21, true);
    rec.setUint32(16, entry.crc, true);
    rec.setUint32(20, entry.size, true);
    rec.setUint32(24, entry.size, true);
    rec.setUint16(28, nameBytes.length, true);
    rec.setUint32(42, localOffset, true);
    parts.push(rec.buffer, nameBytes);
    centralSize += 46 + nameBytes.length;
  }

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, central.length, true);
  eocd.setUint16(10, central.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, centralStart, true);
  parts.push(eocd.buffer);

  return new Blob(parts, { type: "application/zip" });
};

export default function TransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareLink = params.shareLink;
  const accessKey = searchParams.get("key");
  const paymentStatus = searchParams.get("payment_status");

  const [isDownloading, setIsDownloading] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  // Progression par fichier : { [fileId]: pourcentage } — chaque bouton de
  // ligne affiche la sienne, plusieurs téléchargements peuvent coexister
  const [downloadProgressMap, setDownloadProgressMap] = useState({});
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Ref pour annuler le téléchargement
  const downloadAbortRef = useRef(null);
  // Nombre de téléchargements actifs (pour isDownloading global)
  const activeDownloadsRef = useRef(0);

  const setFileProgress = (fileId, pct) =>
    setDownloadProgressMap((m) => ({ ...m, [fileId]: pct }));
  const clearFileProgress = (fileId) =>
    setDownloadProgressMap((m) => {
      const next = { ...m };
      delete next[fileId];
      return next;
    });

  const beginDownloadActivity = () => {
    activeDownloadsRef.current++;
    setIsDownloading(true);
    if (!downloadAbortRef.current) {
      downloadAbortRef.current = new AbortController();
    }
    return downloadAbortRef.current;
  };
  const endDownloadActivity = () => {
    activeDownloadsRef.current = Math.max(0, activeDownloadsRef.current - 1);
    if (activeDownloadsRef.current === 0) {
      setIsDownloading(false);
      downloadAbortRef.current = null;
    }
  };

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

  // Streame un fichier via l'endpoint backend stable en mettant à jour la
  // progression de sa ligne. Retourne { blob, size, crc } (CRC calculé au
  // fil de l'eau pour l'assemblage ZIP éventuel).
  const streamFileWithProgress = async (fileId, fileSize, signal) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const response = await fetch(
      `${apiUrl}api/files/download/${transfer?.fileTransfer?.id}/${fileId}`,
      { signal },
    );

    if (!response.ok || !response.body) {
      throw new Error("Erreur lors du téléchargement");
    }

    const contentLength = response.headers.get("content-length");
    const totalSize = contentLength ? parseInt(contentLength, 10) : fileSize;

    const reader = response.body.getReader();
    // Consolider les chunks en Blobs intermédiaires (~32 Mo) : le navigateur
    // stocke les gros Blobs sur disque, la mémoire JS reste bornée
    const FLUSH_THRESHOLD = 32 * 1024 * 1024;
    const parts = [];
    let pendingChunks = [];
    let pendingBytes = 0;
    let receivedLength = 0;
    let crc = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      pendingChunks.push(value);
      pendingBytes += value.length;
      receivedLength += value.length;
      crc = crc32Append(crc, value);
      if (pendingBytes >= FLUSH_THRESHOLD) {
        parts.push(new Blob(pendingChunks));
        pendingChunks = [];
        pendingBytes = 0;
      }

      if (totalSize) {
        setFileProgress(
          fileId,
          Math.min(Math.round((receivedLength / totalSize) * 100), 100),
        );
      }
    }
    if (pendingChunks.length > 0) {
      parts.push(new Blob(pendingChunks));
    }

    setFileProgress(fileId, 100);
    return { blob: new Blob(parts), size: receivedLength, crc };
  };

  // Marque un événement de téléchargement comme terminé (fire and forget)
  const completeDownloadEvent = (downloadEventId, startTime, isLastFile) => {
    if (!downloadEventId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}api/transfers/download-event/${downloadEventId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ duration: Date.now() - startTime, isLastFile }),
    }).catch(() => {});
  };

  // Fonction pour télécharger un fichier avec progression
  const downloadFile = async (fileId, fileName, fileSize = 0) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Téléchargement natif (très gros fichier sur mobile) : aucun loader
    // dans la page, le navigateur affiche déjà sa propre progression
    const willUseNativeDownload =
      isMobile && (fileSize || 0) > IN_PAGE_SINGLE_FILE_LIMIT;

    const abortController = beginDownloadActivity();
    if (!willUseNativeDownload) {
      setFileProgress(fileId, 0);
    }
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
          signal: abortController.signal,
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

      if (willUseNativeDownload) {
        // Marquer le téléchargement comme terminé AVANT la redirection :
        // la navigation annule les fetch en cours sur mobile
        completeDownloadEvent(downloadInfo.downloadEventId, startTime, true);

        // Laisser le navigateur mobile gérer le téléchargement nativement,
        // sans quitter la page de transfert
        triggerMobileDownload(
          `${apiUrl}api/files/download/${transfer?.fileTransfer?.id}/${fileId}`,
        );
        toast.info(
          "Acceptez le téléchargement — la progression s'affiche dans les téléchargements de votre navigateur",
        );
        return;
      }

      const { blob } = await streamFileWithProgress(
        fileId,
        fileSize,
        abortController.signal,
      );
      saveBlobAsFile(blob, fileName);

      completeDownloadEvent(downloadInfo.downloadEventId, startTime, true);

      // Notification de fin (sur iOS, la fenêtre d'enregistrement apparaît
      // au même moment : le contenu est déjà téléchargé)
      toast.success(
        /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "Téléchargement terminé — appuyez sur « Télécharger » pour enregistrer"
          : "Téléchargement terminé !",
      );
    } catch (error) {
      // Si c'est une annulation, ne pas afficher d'erreur
      if (error.name === "AbortError") {
        toast.info("Téléchargement annulé");
        return;
      }
      console.error("Erreur lors du téléchargement:", error);
      toast.error(error.message || "Erreur lors du téléchargement du fichier");
    } finally {
      clearFileProgress(fileId);
      endDownloadActivity();
    }
  };

  // Fonction pour télécharger tous les fichiers
  const downloadAllFiles = async () => {
    const transferFilesList = transfer?.fileTransfer?.files || [];

    // Transfert à un seul fichier : même logique que le téléchargement
    // individuel (streaming avec progression, natif au-delà du seuil)
    if (transferFilesList.length === 1) {
      const single = transferFilesList[0];
      return downloadFile(
        single.id || single.fileId,
        single.originalName,
        single.size,
      );
    }

    const abortController = beginDownloadActivity();
    setIsBulkDownloading(true);
    const startTime = Date.now();
    // Les IDs dont on a affiché la progression (à nettoyer à la fin)
    const startedFileIds = [];

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
          signal: abortController.signal,
        },
      );

      if (!authResponse.ok) {
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

      const hasWatermark = transfer?.fileTransfer?.hasWatermark;
      if (hasWatermark) {
        toast.error(
          "Les fichiers de ce transfert sont protégés par un filigrane et ne peuvent pas être téléchargés.",
        );
        return;
      }

      // Filtrer les téléchargements autorisés
      const downloadableFileIds = transferFilesList.map((f) => f.id);
      const filteredDownloads = authData.downloads.filter((d) =>
        downloadableFileIds.includes(d.fileId),
      );

      if (filteredDownloads.length === 0) {
        toast.error("Aucun fichier téléchargeable disponible.");
        return;
      }

      // Limites du format zip32 : au-delà, ZIP natif streamé par le backend
      const estimatedTotal = transferFilesList.reduce(
        (acc, f) => acc + (f.size || 0),
        0,
      );
      const ZIP32_LIMIT = 0xf0000000; // ~3,75 Go, marge sous les 4 Go
      if (
        estimatedTotal > ZIP32_LIMIT ||
        filteredDownloads.length > 65000 ||
        transferFilesList.some((f) => (f.size || 0) > ZIP32_LIMIT)
      ) {
        triggerMobileDownload(
          `${apiUrl}file-transfer/download-all?link=${shareLink}&key=${accessKey}`,
        );
        toast.info(
          "Acceptez le téléchargement — la progression s'affiche dans les téléchargements de votre navigateur",
        );
        return;
      }

      // Télécharger les fichiers en parallèle (BULK_CONCURRENCY à la fois) :
      // le pourcentage monte sur le bouton de téléchargement de chaque ligne.
      // Chaque fichier devient un Blob (stocké sur disque par le navigateur),
      // puis TOUT est assemblé en un seul ZIP remis en une fois : une seule
      // confirmation d'enregistrement, une seule notification de fin.
      const zipEntries = new Array(filteredDownloads.length);
      let nextIndex = 0;

      const worker = async () => {
        while (true) {
          const i = nextIndex++;
          if (i >= filteredDownloads.length) return;
          const downloadInfo = filteredDownloads[i];
          const file = transferFilesList.find(
            (f) => f.id === downloadInfo.fileId,
          );

          startedFileIds.push(downloadInfo.fileId);
          setFileProgress(downloadInfo.fileId, 0);

          try {
            const { blob, size, crc } = await streamFileWithProgress(
              downloadInfo.fileId,
              file?.size || 0,
              abortController.signal,
            );
            zipEntries[i] = {
              name:
                downloadInfo.fileName || file?.originalName || `fichier-${i}`,
              size,
              crc,
              blob,
            };
            completeDownloadEvent(
              downloadInfo.downloadEventId,
              startTime,
              i === filteredDownloads.length - 1,
            );
          } catch (fileError) {
            if (fileError.name === "AbortError") throw fileError;
            console.error(
              `Erreur téléchargement ${downloadInfo.fileName}:`,
              fileError,
            );
            clearFileProgress(downloadInfo.fileId);
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(BULK_CONCURRENCY, filteredDownloads.length) },
          worker,
        ),
      );

      const completedEntries = zipEntries.filter(Boolean);
      if (completedEntries.length === 0) {
        throw new Error("Aucun fichier n'a pu être téléchargé");
      }

      // Assembler et remettre le ZIP (une seule confirmation iOS)
      const zipBlob = buildStoreZip(completedEntries);
      saveBlobAsFile(
        zipBlob,
        `${transfer?.fileTransfer?.title || "transfert"}.zip`,
      );

      // Notification quand TOUT est téléchargé
      toast.success(
        completedEntries.length === filteredDownloads.length
          ? "Tous les fichiers sont téléchargés !"
          : `${completedEntries.length} fichier(s) sur ${filteredDownloads.length} téléchargé(s)`,
      );
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
      startedFileIds.forEach(clearFileProgress);
      setIsBulkDownloading(false);
      endDownloadActivity();
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
    // Fermer la preview AVANT de lancer le téléchargement : l'utilisateur
    // retrouve la page principale où la progression s'affiche dans le
    // bouton en bas
    setPreviewFile(null);
    await downloadFile(fileId, file.originalName, file.size);
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
        isDownloading={
          isBulkDownloading ||
          downloadProgressMap[
            previewFile?.id || previewFile?.fileId || previewFile?.path
          ] !== undefined
        }
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
      <div className="w-full lg:w-1/2 relative overflow-hidden flex flex-col items-center justify-center px-4 py-8 lg:px-8 lg:py-10">
        {/* Fond style Newbi */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f4f3ff] via-white to-[#f4f3ff] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#5a50ff]/10 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#5a50ff]/10 blur-3xl -z-10 pointer-events-none" />

        {/* Logo mobile - centré au-dessus de la card */}
        <div className="lg:hidden mb-10">
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
              {displayFiles?.[0] && previewDisabled && (
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

              {/* Preview de la première image (reste affichée pendant un
                  téléchargement : la progression vit dans le bouton en bas) */}
              {displayFiles?.[0] && !previewDisabled && (
                <div className="mx-4 mt-4 h-32 bg-gray-100 rounded-xl overflow-hidden relative">
                  {
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
                        const placeholder = (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-50">
                            <FileIcon className="w-14 h-14 text-gray-200" />
                            {ext && (
                              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                {ext}
                              </span>
                            )}
                          </div>
                        );

                        if (isPdf && previewSrc && !thumbnailError) {
                          return (
                            <div className="w-full h-full bg-white pointer-events-none">
                              <PdfPreview
                                src={previewSrc}
                                firstPageOnly
                                fallback={placeholder}
                              />
                            </div>
                          );
                        }
                        return placeholder;
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
                  }
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
                          {!isDownloadBlocked(file) &&
                            (() => {
                              const rowFileId =
                                file.id || file.fileId || file.path;
                              const rowProgress =
                                downloadProgressMap[rowFileId];
                              const rowDownloading = rowProgress !== undefined;
                              return (
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
                                  disabled={rowDownloading || isBulkDownloading}
                                  className={`p-2 transition-colors cursor-pointer ${
                                    rowDownloading || isBulkDownloading
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "text-gray-400 hover:text-[#5a50ff]"
                                  }`}
                                >
                                  {rowDownloading ? (
                                    <span className="text-[10px] font-semibold text-[#5a50ff] tabular-nums">
                                      {Math.round(rowProgress)}%
                                    </span>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                              );
                            })()}
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
                  {/* Le seul loader est le % sur la ligne du fichier : le
                      bouton global garde son libellé */}
                  <Button
                    onClick={downloadAllFiles}
                    disabled={isBulkDownloading}
                    className="text-white px-10 w-full rounded-xl"
                  >
                    {(transfer?.fileTransfer?.files?.length || 0) > 1
                      ? "Tout télécharger"
                      : "Télécharger"}
                  </Button>
                  {isDownloading && (
                    <button
                      onClick={cancelDownload}
                      className="mt-2 text-[11px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer block mx-auto"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
