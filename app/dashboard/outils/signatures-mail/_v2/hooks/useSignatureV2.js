"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  SIGNATURE_CATALOG_V2,
  SIGNATURE_V2,
  UPDATE_SIGNATURE_V2,
  toInput,
} from "../graphql";
import { resetMovedBlocks } from "../slots";

const SAVE_DELAY_MS = 800;
/** Modifications rapprochées (frappe) regroupées en un seul pas d'annulation. */
const HISTORY_COALESCE_MS = 600;
const HISTORY_LIMIT = 100;

/** Fusion profonde limitée à un niveau d'objets (identity, style…). */
function merge(prev, patch) {
  const next = { ...prev };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      next[key] = { ...(prev[key] || {}), ...value };
    } else {
      next[key] = value;
    }
  }
  return next;
}

/**
 * Charge une signature v2, garde une copie locale éditable, et enregistre
 * automatiquement après chaque modification (avec un léger délai). Le
 * document serveur reste la référence : après un enregistrement, la copie
 * locale est réalignée sur la réponse pour les champs normalisés.
 *
 * Historique : chaque modification (texte, style, déplacement) peut être
 * annulée puis rétablie ; les images, envoyées au serveur, n'en font pas
 * partie.
 */
export function useSignatureV2(id) {
  const [sig, setSigState] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | dirty | saving | saved | error
  const timer = useRef(null);
  const pending = useRef(null);
  const hydratedId = useRef(null);
  // Copie synchrone de l'état, pour l'historique hors des mises à jour React
  const sigRef = useRef(null);
  const history = useRef({ past: [], future: [], lastPush: 0 });
  const [historyFlags, setHistoryFlags] = useState({ canUndo: false, canRedo: false });
  // Numéro d'enregistrement : seule la réponse du dernier envoi est appliquée
  const saveSeq = useRef(0);
  // Échec d'enregistrement : nouvel essai de plus en plus espacé
  const retryDelay = useRef(0);
  // Nom refusé par l'API (vide ou déjà pris) : gardé à l'écran, pas renvoyé
  // tant qu'il ne change pas, pour que le reste s'enregistre quand même
  const refusedName = useRef(null);

  const setSig = useCallback((value) => {
    setSigState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      sigRef.current = next;
      return next;
    });
  }, []);

  const syncHistoryFlags = useCallback(() => {
    const h = history.current;
    setHistoryFlags({ canUndo: h.past.length > 0, canRedo: h.future.length > 0 });
  }, []);

  const { data, loading, error, refetch } = useQuery(SIGNATURE_V2, {
    variables: { id },
    skip: !id,
    fetchPolicy: "network-only",
  });
  const { data: catalogData } = useQuery(SIGNATURE_CATALOG_V2, {
    fetchPolicy: "cache-first",
  });
  const catalog = catalogData?.signatureCatalogV2 || null;

  const [updateMutation] = useMutation(UPDATE_SIGNATURE_V2);

  // Hydratation : une seule fois par identifiant, pour ne jamais écraser une
  // saisie en cours par une réponse serveur tardive.
  useEffect(() => {
    const fetched = data?.emailSignatureV2;
    if (fetched && hydratedId.current !== fetched.id) {
      hydratedId.current = fetched.id;
      setSig(fetched);
      history.current = { past: [], future: [], lastPush: 0 };
      syncHistoryFlags();
      setStatus("idle");
    }
  }, [data, setSig, syncHistoryFlags]);

  /**
   * Enregistre la dernière modification. Renvoie false si elle n'a pas pu
   * l'être : elle reste alors en attente (nouvel essai automatique, fermeture
   * de l'onglet bloquée), jamais perdue.
   */
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const toSave = pending.current;
    if (!toSave) return true;
    pending.current = null;
    setStatus("saving");
    const seq = ++saveSeq.current;
    const input = toInput(toSave);
    const name = String(input.name ?? "").trim();
    if (!name || name === refusedName.current) delete input.name;
    try {
      const { data: saved } = await updateMutation({
        variables: { id, input },
      });
      retryDelay.current = 0;
      // Une réponse plus ancienne arrivée après une plus récente est ignorée
      if (seq !== saveSeq.current) return true;
      const server = saved?.updateEmailSignatureV2;
      if (server) {
        // Réaligne les champs normalisés (couleurs, bornes) sans toucher à
        // une modification arrivée entre-temps, ni au nom refusé affiché
        setSig((current) =>
          pending.current
            ? current
            : {
                ...current,
                ...server,
                images: server.images,
                name: input.name === undefined ? current.name : server.name,
              },
        );
      }
      setStatus(pending.current ? "dirty" : "saved");
      return true;
    } catch (err) {
      if (seq !== saveSeq.current) return false;
      const message = err?.graphQLErrors?.[0]?.message || "";
      // La modification attend un nouvel essai (sauf plus récente)
      if (!pending.current) pending.current = toSave;
      if (input.name !== undefined && /\bnom\b/i.test(message)) {
        // Seul le nom est refusé : le reste repart tout de suite sans lui
        refusedName.current = input.name;
        toast.error(
          /existe/i.test(message)
            ? "Ce nom de signature est déjà utilisé : le reste de vos modifications est enregistré"
            : message,
        );
        timer.current = setTimeout(flush, 0);
        return false;
      }
      setStatus("error");
      const first = retryDelay.current === 0;
      retryDelay.current = Math.min(Math.max(retryDelay.current * 2, 2000), 30000);
      timer.current = setTimeout(flush, retryDelay.current);
      if (first) {
        toast.error(
          message ||
            "Enregistrement impossible pour l'instant : nouvel essai automatique, vos modifications sont gardées",
        );
      }
      return false;
    }
  }, [id, updateMutation, setSig]);

  /** Programme l'enregistrement de l'état courant. */
  const scheduleSave = useCallback(
    (next) => {
      pending.current = next;
      setStatus("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  const update = useCallback(
    (patch, { asIs = false } = {}) => {
      const prev = sigRef.current;
      if (!prev) return;
      // Un élément déplacé ailleurs perd la largeur réglée pour son ancienne
      // place (déplacements par glisser-déposer comme par les réglages ;
      // une partie emmenée seule ne compte pas). `asIs` : style complet
      // appliqué tel quel (modèle enregistré, ses largeurs vont avec ses
      // places)
      const next = merge(
        prev,
        patch.style && !asIs
          ? { ...patch, style: resetMovedBlocks(prev, patch.style) }
          : patch,
      );
      const h = history.current;
      const now = Date.now();
      if (now - h.lastPush > HISTORY_COALESCE_MS) {
        h.past.push(prev);
        if (h.past.length > HISTORY_LIMIT) h.past.shift();
      }
      h.lastPush = now;
      h.future = [];
      syncHistoryFlags();
      setSig(next);
      scheduleSave(next);
    },
    [setSig, scheduleSave, syncHistoryFlags],
  );

  /** Revient à l'état précédent (ou suivant) ; les images restent actuelles. */
  const travel = useCallback(
    (from, to) => {
      const h = history.current;
      const current = sigRef.current;
      if (!current || h[from].length === 0) return false;
      const target = h[from].pop();
      h[to].push(current);
      h.lastPush = 0;
      const next = { ...target, images: current.images, isDefault: current.isDefault };
      syncHistoryFlags();
      setSig(next);
      scheduleSave(next);
      return true;
    },
    [setSig, scheduleSave, syncHistoryFlags],
  );
  const undo = useCallback(() => travel("past", "future"), [travel]);
  const redo = useCallback(() => travel("future", "past"), [travel]);

  /**
   * Remplace la signature locale par une réponse serveur (après un upload),
   * ou y reporte un changement partiel ({ isDefault }) : les images ne
   * changent que si la réponse les contient. Une saisie pas encore
   * enregistrée garde la main : seuls les champs que l'utilisateur ne tape
   * pas (images, par défaut) sont repris. `resetHistory` : la réponse
   * remplace tout le contenu (autre personne), annuler n'y a plus de sens.
   */
  const replace = useCallback(
    (server, { resetHistory = false } = {}) => {
      if (!server) return;
      setSig((current) => {
        const images = server.images ?? current.images;
        if (pending.current) {
          return {
            ...current,
            images,
            ...(server.isDefault !== undefined
              ? { isDefault: server.isDefault }
              : {}),
          };
        }
        return { ...current, ...server, images };
      });
      if (resetHistory) {
        history.current = { past: [], future: [], lastPush: 0 };
        syncHistoryFlags();
      }
    },
    [setSig, syncHistoryFlags],
  );

  // Garde-fou : une modification non enregistrée ne doit pas être perdue en
  // fermant l'onglet.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return {
    sig,
    setSig,
    update,
    replace,
    flush,
    undo,
    redo,
    canUndo: historyFlags.canUndo,
    canRedo: historyFlags.canRedo,
    status,
    loading: loading && !sig,
    error,
    refetch,
    catalog,
    initialRender: data?.emailSignatureV2?.render || null,
  };
}
