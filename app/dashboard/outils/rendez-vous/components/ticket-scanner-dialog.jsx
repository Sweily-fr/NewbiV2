"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeEuro,
  CameraOff,
  CheckCircle2,
  Loader2,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { bookingErrorMessage, useEventMutations } from "@/src/hooks/useBooking";
import {
  checkInOutcome,
  dueOnSiteLabel,
  formatCents,
  parseTicketCode,
} from "@/src/utils/booking-events";

// Même code relu par la caméra : ignoré pendant ce délai
const SAME_CODE_DELAY_MS = 4000;
const SCAN_INTERVAL_MS = 180;
// Résultat affiché avant de reprendre le scan (vert plus court)
const RESULT_DURATION_MS = { success: 2200, warning: 4000, error: 4000 };

const TONES = {
  success: { className: "bg-emerald-600", Icon: CheckCircle2, vibrate: [90] },
  warning: {
    className: "bg-amber-500",
    Icon: TriangleAlert,
    vibrate: [90, 70, 90],
  },
  error: { className: "bg-red-600", Icon: XCircle, vibrate: [300] },
};

/**
 * Lecteur de QR code : BarcodeDetector quand le navigateur l'a (Chrome
 * Android, Safari récent), sinon jsQR sur une image de la vidéo.
 */
async function createQrReader() {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.includes("qr_code")) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        return async (video) => {
          const codes = await detector.detect(video);
          return codes[0]?.rawValue || null;
        };
      }
    } catch {
      // Détecteur indisponible : jsQR
    }
  }
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;
    // Image réduite : lecture plus rapide, assez nette pour un QR
    const scale = Math.min(1, 720 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(image.data, image.width, image.height, {
      inversionAttempts: "dontInvert",
    });
    return code?.data || null;
  };
}

/**
 * Contrôle des billets à l'entrée : plein écran, caméra arrière, résultat
 * immédiat (vert : valide et marqué présent ; orange : déjà scanné ; rouge :
 * inconnu, annulé, autre événement), saisie du numéro en secours.
 */
export function TicketScannerDialog({ type, timeZone, onClose }) {
  const open = Boolean(type);
  const typeId = type?.id || null;
  // Élément vidéo en état : le contenu du dialogue est monté après son
  // ouverture (portail), la caméra démarre quand la vidéo existe
  const [video, setVideo] = useState(null);
  const verifyRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ code: null, at: 0 });
  const resultTimerRef = useRef(null);
  const [camera, setCamera] = useState("starting");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [manual, setManual] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const { checkIn, markPaidOnSite } = useEventMutations();

  const clearResult = useCallback(() => {
    clearTimeout(resultTimerRef.current);
    setResult(null);
    busyRef.current = false;
  }, []);

  const showResult = useCallback(
    (outcome) => {
      setResult(outcome);
      try {
        navigator.vibrate?.(TONES[outcome.tone]?.vibrate || 0);
      } catch {
        // Vibration indisponible
      }
      clearTimeout(resultTimerRef.current);
      // Reste à encaisser : le résultat reste affiché jusqu'au geste du
      // contrôleur (réglé, ou scanner le suivant)
      if (outcome.dueOnSite && !outcome.duePaid) return;
      resultTimerRef.current = setTimeout(
        clearResult,
        RESULT_DURATION_MS[outcome.tone] || 3000,
      );
    },
    [clearResult],
  );

  const markPaid = useCallback(async () => {
    if (!result?.registrationId || markingPaid) return;
    setMarkingPaid(true);
    try {
      await markPaidOnSite(result.registrationId, true);
      showResult({ ...result, duePaid: true, paidError: "" });
    } catch (error) {
      setResult((current) =>
        current
          ? { ...current, paidError: bookingErrorMessage(error) }
          : current,
      );
    } finally {
      setMarkingPaid(false);
    }
  }, [result, markingPaid, markPaidOnSite, showResult]);

  const verify = useCallback(
    async (raw, { fromCamera = false } = {}) => {
      if (!typeId) return;
      const text = String(raw || "").trim();
      if (!text) return;
      const now = Date.now();
      if (
        fromCamera &&
        lastRef.current.code === text &&
        now - lastRef.current.at < SAME_CODE_DELAY_MS
      ) {
        return;
      }
      lastRef.current = { code: text, at: now };
      busyRef.current = true;
      const parsed = parseTicketCode(text);
      if (!parsed) {
        showResult(checkInOutcome({ result: "UNKNOWN" }));
        return;
      }
      setChecking(true);
      try {
        const checked = await checkIn(typeId, parsed.code);
        showResult(checkInOutcome(checked, { timeZone }));
      } catch (error) {
        showResult({
          tone: "error",
          title: "Contrôle impossible",
          name: "",
          detail: bookingErrorMessage(error),
        });
      } finally {
        setChecking(false);
      }
    },
    [typeId, checkIn, timeZone, showResult],
  );

  verifyRef.current = verify;

  // Caméra et lecture en boucle tant que la fenêtre est ouverte
  useEffect(() => {
    if (!open || !video) return undefined;
    let cancelled = false;
    let stream = null;
    let timer = null;
    setCamera("starting");
    setResult(null);
    busyRef.current = false;
    lastRef.current = { code: null, at: 0 };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("unsupported");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (error) {
        if (!cancelled) {
          setCamera(
            error?.name === "NotAllowedError" || error?.name === "SecurityError"
              ? "denied"
              : "unsupported",
          );
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Lecture automatique refusée : la vidéo démarre au premier geste
      }
      const read = await createQrReader();
      if (cancelled) return;
      setCamera("ready");
      const loop = async () => {
        if (cancelled) return;
        if (!busyRef.current && video.readyState >= 2) {
          try {
            const text = await read(video);
            if (text && !cancelled) {
              verifyRef.current?.(text, { fromCamera: true });
            }
          } catch {
            // Image illisible : image suivante
          }
        }
        timer = setTimeout(loop, SCAN_INTERVAL_MS);
      };
      loop();
    };
    start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(resultTimerRef.current);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [open, video]);

  const tone = result ? TONES[result.tone] || TONES.error : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        noAnimation
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white sm:max-w-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-medium text-white">
              Contrôle des billets
            </DialogTitle>
            <DialogDescription className="truncate text-xs text-white/70">
              {type?.name}
              {type
                ? ` · Présents ${type.checkedInCount} / ${type.ticketsCount}`
                : ""}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label="Fermer le contrôle des billets"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <video
            ref={setVideo}
            muted
            playsInline
            autoPlay
            className="absolute inset-0 size-full object-cover"
          />
          {camera === "ready" && !result && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aspect-square w-[min(70vw,320px)] rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              <p className="absolute bottom-6 left-0 w-full px-6 text-center text-sm text-white/90">
                Placez le QR code du billet dans le cadre
              </p>
            </div>
          )}
          {camera === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
              <Loader2 className="size-7 animate-spin" aria-hidden="true" />
              <p className="text-sm">Ouverture de la caméra</p>
            </div>
          )}
          {(camera === "denied" || camera === "unsupported") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <CameraOff className="size-9 text-white/70" aria-hidden="true" />
              <p className="text-base font-medium">Caméra indisponible</p>
              <p className="max-w-sm text-sm text-white/70">
                {camera === "denied"
                  ? "Autorisez l'accès à la caméra dans les réglages du navigateur, puis rouvrez le contrôle. En attendant, saisissez le numéro du billet ci-dessous."
                  : "Ce navigateur ne donne pas accès à la caméra. Saisissez le numéro du billet ci-dessous."}
              </p>
            </div>
          )}
          {checking && !result && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-10 animate-spin" aria-hidden="true" />
              <span className="sr-only">Vérification du billet</span>
            </div>
          )}
          {result && result.dueOnSite ? (
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-6 text-center",
                tone.className,
              )}
            >
              <tone.Icon className="size-16" aria-hidden="true" />
              <span role="status" aria-live="assertive" className="contents">
                <span className="text-4xl font-semibold">{result.title}</span>
                {result.name && (
                  <span className="text-2xl font-medium">{result.name}</span>
                )}
                {result.detail && (
                  <span className="max-w-md text-base text-white/90">
                    {result.detail}
                  </span>
                )}
                <span className="mt-2 w-full max-w-md rounded-2xl bg-white px-5 py-4 text-gray-900">
                  {result.duePaid ? (
                    <span className="block text-xl font-semibold text-emerald-700">
                      Réglé sur place :{" "}
                      {formatCents(result.dueOnSite, result.currency)}
                    </span>
                  ) : (
                    <span className="block text-2xl font-semibold">
                      {dueOnSiteLabel(result.dueOnSite, result.currency)}
                    </span>
                  )}
                  {result.paidError && (
                    <span className="mt-1 block text-sm text-red-700">
                      {result.paidError}
                    </span>
                  )}
                </span>
              </span>
              <div className="mt-4 flex w-full max-w-md flex-col gap-2">
                {!result.duePaid && (
                  <button
                    type="button"
                    onClick={markPaid}
                    disabled={markingPaid}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-base font-medium text-gray-900 disabled:opacity-70"
                  >
                    {markingPaid ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <BadgeEuro className="size-4" aria-hidden="true" />
                    )}
                    Marquer comme réglé
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearResult}
                  className="cursor-pointer rounded-full bg-white/20 px-5 py-2.5 text-sm font-medium"
                >
                  Scanner le suivant
                </button>
              </div>
            </div>
          ) : (
            result && (
              <button
                type="button"
                onClick={clearResult}
                className={cn(
                  "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 px-6 text-center",
                  tone.className,
                )}
              >
                <tone.Icon className="size-20" aria-hidden="true" />
                <span role="status" aria-live="assertive" className="contents">
                  <span className="text-4xl font-semibold">{result.title}</span>
                  {result.name && (
                    <span className="text-2xl font-medium">{result.name}</span>
                  )}
                  {result.detail && (
                    <span className="max-w-md text-base text-white/90">
                      {result.detail}
                    </span>
                  )}
                </span>
                <span className="mt-6 rounded-full bg-white/20 px-5 py-2.5 text-sm font-medium">
                  Scanner le suivant
                </span>
              </button>
            )
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!manual.trim() || checking) return;
            verify(manual);
            setManual("");
          }}
          className="flex shrink-0 gap-2 bg-black px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]"
        >
          <input
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="Numéro du billet, ex. EVT-7K3M9Q"
            aria-label="Numéro du billet"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-base text-white placeholder:text-white/50 outline-none focus:border-white/60"
          />
          <button
            type="submit"
            disabled={!manual.trim() || checking}
            className="shrink-0 cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity disabled:cursor-default disabled:opacity-50"
          >
            Vérifier
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
