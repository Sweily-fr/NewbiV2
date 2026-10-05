"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  SIGNATURES_V2,
  SIGNATURE_CATALOG_V2,
  SIGNATURE_V2,
  UPDATE_SIGNATURE_V2,
  toInput,
} from "../graphql";
import { errorCode, refusalToast } from "../errors";
import { resetMovedBlocks } from "../slots";

const SAVE_DELAY_MS = 800;
/** Modifications rapprochées (frappe) regroupées en un seul pas d'annulation. */
const HISTORY_COALESCE_MS = 600;
const HISTORY_LIMIT = 100;

/**
 * Refus définitifs d'un enregistrement : un nouvel essai n'y changerait
 * rien. L'éditeur passe en lecture seule et dit pourquoi.
 */
const BLOCKING_CODES = {
  NOT_FOUND: "notFound",
  FORBIDDEN: "forbidden",
  SUBSCRIPTION_READ_ONLY: "subscription",
};

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

/** Textes tapés par l'utilisateur, groupe par groupe. */
const TYPED_FIELDS = {
  identity: ["firstName", "lastName", "jobTitle", "department", "company", "tagline"],
  contact: ["email", "phone", "mobile", "website", "address"],
  cta: ["label", "url"],
  banner: ["url", "alt"],
  disclaimer: ["text"],
};

/**
 * Texte rangé comme le serveur le range (blancs regroupés, bords rognés),
 * sans sa troncature : un texte coupé à sa longueur maximale reste réaligné
 * sur la réponse.
 */
const squash = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

/**
 * La mention, rangée comme le serveur la range (multiline) : retours à la
 * ligne et espaces insécables gardés, blancs regroupés et bords rognés
 * ligne par ligne, une ligne vide au plus. Sans sa limite de lignes ni de
 * longueur, comme squash : une mention coupée reste réalignée.
 */
const squashLines = (v) =>
  String(v ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n\u00a0\u202f]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Réponse d'un enregistrement appliquée à la copie locale. Le serveur fait
 * foi (couleurs, bornes, texte trop long coupé), sauf pour un texte qu'il
 * n'a fait que nettoyer : la valeur tapée reste, sinon l'espace qu'on vient
 * de taper disparaît pendant la pause et le mot suivant se colle au
 * précédent (« Responsablecommercial »), ou la ligne qu'on vient d'ouvrir
 * dans la mention se referme. Les images et « par défaut », que
 * l'enregistrement ne change jamais, restent ceux affichés.
 */
function withServerValues(current, server) {
  const next = {
    ...current,
    ...server,
    images: current.images,
    isDefault: current.isDefault,
  };
  for (const [group, keys] of Object.entries(TYPED_FIELDS)) {
    const local = current[group];
    if (!local || !server[group]) continue;
    // La mention garde ses paragraphes : comparée ligne par ligne
    const tidy = group === "disclaimer" ? squashLines : squash;
    const kept = {};
    for (const key of keys) {
      if (typeof local[key] === "string" && tidy(local[key]) === server[group][key]) {
        kept[key] = local[key];
      }
    }
    next[group] = { ...server[group], ...kept };
  }
  // Lien d'un réseau : même règle, s'il s'agit du même réseau au même rang
  if (Array.isArray(current.social) && Array.isArray(server.social)) {
    next.social = server.social.map((s, i) => {
      const mine = current.social[i];
      return mine?.network === s.network &&
        typeof mine.url === "string" &&
        squash(mine.url) === s.url
        ? { ...s, url: mine.url }
        : s;
    });
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
  // Changement de personne en cours : aucune modification n'est acceptée,
  // la réponse du serveur remplace tout le contenu (sinon elle effacerait
  // ce qui serait tapé pendant la requête, ou serait effacée par lui)
  const locked = useRef(false);
  const [editsLocked, setEditsLocked] = useState(false);
  // Refus définitif (signature supprimée, rôle, abonnement) : plus rien ne
  // s'enregistre, l'éditeur passe en lecture seule
  const blocked = useRef(null);
  const [saveBlocked, setSaveBlocked] = useState(null);
  // Enregistrements envoyés dont la réponse n'est pas encore arrivée
  const inFlight = useRef(0);
  // Éditeur encore affiché : une fois quitté, plus aucun essai programmé
  const alive = useRef(true);
  const client = useApolloClient();

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

  // Un refus de l'API doit faire échouer l'enregistrement : sinon il
  // passerait pour une réussite (« Enregistré ») et la saisie serait perdue
  const [updateMutation] = useMutation(UPDATE_SIGNATURE_V2, { errorPolicy: "none" });

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
   * de l'onglet bloquée), jamais perdue, sauf refus définitif (signature
   * supprimée, rôle, abonnement) : l'éditeur passe alors en lecture seule.
   * Une fois l'éditeur quitté, un échec est signalé sans nouvel essai.
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
    inFlight.current += 1;
    try {
      const { data: saved } = await updateMutation({
        variables: { id, input },
      });
      retryDelay.current = 0;
      if (!alive.current) {
        // Éditeur quitté : la liste où l'on arrive reprend le nouveau nom
        // et le nouvel aperçu (sa requête est partie avant la fin de
        // l'enregistrement)
        client.refetchQueries({ include: [SIGNATURES_V2] }).catch(() => {});
        return true;
      }
      // Une réponse plus ancienne arrivée après une plus récente est ignorée
      if (seq !== saveSeq.current) return true;
      const server = saved?.updateEmailSignatureV2;
      if (server) {
        // Réaligne les champs normalisés (couleurs, bornes) sans toucher à
        // une modification arrivée entre-temps, ni au nom refusé affiché,
        // ni à un nom que le serveur n'a fait que rogner
        setSig((current) => {
          if (pending.current) return current;
          const next = withServerValues(current, server);
          if (
            input.name === undefined ||
            String(current.name ?? "").trim() === server.name
          ) {
            next.name = current.name;
          }
          return next;
        });
      }
      setStatus(pending.current ? "dirty" : "saved");
      return true;
    } catch (err) {
      if (seq !== saveSeq.current) return false;
      const code = errorCode(err);
      const message = err?.graphQLErrors?.[0]?.message || "";
      const label = String(toSave.name ?? "").trim() || "sans nom";
      const lost = `Vos dernières modifications de la signature « ${label} » n'ont pas pu être enregistrées`;
      // Refus définitif : rien ne pourra être enregistré, inutile de
      // réessayer ou de retenir la fermeture de l'onglet
      if (BLOCKING_CODES[code]) {
        pending.current = null;
        if (alive.current) {
          blocked.current = BLOCKING_CODES[code];
          setSaveBlocked(BLOCKING_CODES[code]);
          setStatus("error");
        } else {
          toast.error(lost, refusalToast(err));
        }
        return false;
      }
      if (
        input.name !== undefined &&
        (code === "ALREADY_EXISTS" || /\bnom\b/i.test(message))
      ) {
        // Seul le nom est refusé : le reste repart tout de suite sans lui,
        // et c'est le résultat de cet envoi qui compte
        if (!pending.current) pending.current = toSave;
        refusedName.current = name;
        const taken = code === "ALREADY_EXISTS" || /existe/i.test(message);
        toast.error(
          !taken
            ? message
            : alive.current
              ? "Ce nom de signature est déjà utilisé : le reste de vos modifications est enregistré"
              : `Le nom « ${name} » est déjà utilisé : la signature garde son nom précédent`,
        );
        return flush();
      }
      if (!alive.current) {
        // Éditeur quitté : plus aucun essai programmé, il pourrait écraser
        // une saisie faite après la réouverture de la signature
        toast.error(lost, refusalToast(err));
        return false;
      }
      // La modification attend un nouvel essai (sauf plus récente)
      if (!pending.current) pending.current = toSave;
      setStatus("error");
      const first = retryDelay.current === 0;
      retryDelay.current = Math.min(Math.max(retryDelay.current * 2, 2000), 30000);
      timer.current = setTimeout(flush, retryDelay.current);
      if (first) {
        toast.error(
          "Enregistrement impossible pour l'instant : nouvel essai automatique, vos modifications sont gardées",
          refusalToast(err),
        );
      }
      return false;
    } finally {
      inFlight.current -= 1;
    }
  }, [id, updateMutation, setSig, client]);

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
    (patch, { asIs = false, step = false } = {}) => {
      const prev = sigRef.current;
      if (!prev || locked.current || blocked.current) return;
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
      // `step` : une étape à elle seule (retrait d'un élément), jamais
      // fondue avec la frappe qui précède ou qui suit, pour qu'« Annuler »
      // rende exactement le texte d'avant
      if (step || now - h.lastPush > HISTORY_COALESCE_MS) {
        h.past.push(prev);
        if (h.past.length > HISTORY_LIMIT) h.past.shift();
      }
      h.lastPush = step ? 0 : now;
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
      if (!current || locked.current || blocked.current || h[from].length === 0) {
        return false;
      }
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
   * Reporte une réponse serveur dans la signature locale. Envoi ou retrait
   * d'image, « par défaut » : seuls les images et « par défaut » sont
   * repris (`image` : seulement cette image-là). Le reste de la réponse a
   * été lu au début de la requête, avant les secondes d'envoi : il
   * effacerait ce qui a été tapé entre-temps. `resetHistory` : la réponse
   * remplace tout le contenu (autre personne, modifications gelées pendant
   * la requête), annuler n'y a plus de sens.
   */
  const replace = useCallback(
    (server, { resetHistory = false, image = null } = {}) => {
      if (!server) return;
      setSig((current) => {
        if (resetHistory && !pending.current) {
          return { ...current, ...server, images: server.images ?? current.images };
        }
        let images = current.images;
        if (server.images) {
          images = image
            ? { ...current.images, [image]: server.images[image] ?? null }
            : server.images;
        }
        return {
          ...current,
          images,
          ...(server.isDefault !== undefined
            ? { isDefault: server.isDefault }
            : {}),
        };
      });
      if (resetHistory) {
        history.current = { past: [], future: [], lastPush: 0 };
        syncHistoryFlags();
      }
    },
    [setSig, syncHistoryFlags],
  );

  /** Gèle (ou dégèle) les modifications, le temps d'un changement de personne. */
  const lockEdits = useCallback((on) => {
    locked.current = Boolean(on);
    setEditsLocked(Boolean(on));
  }, []);

  /**
   * Abandonne la modification en attente : signature supprimée, ou départ
   * sans enregistrer choisi par l'utilisateur. Une réponse encore attendue
   * n'est plus appliquée, son échec n'est plus réessayé.
   */
  const discard = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    pending.current = null;
    saveSeq.current += 1;
  }, []);

  /** Refus définitif en cours, lu au moment de l'appel (après un flush). */
  const isSaveBlocked = useCallback(() => Boolean(blocked.current), []);

  // Dernière version de flush, pour l'enregistrement au départ
  const flushRef = useRef(flush);
  flushRef.current = flush;

  // Garde-fou : une modification non enregistrée ne doit pas être perdue en
  // fermant l'onglet. Quitter l'éditeur autrement (menu latéral, Précédent,
  // geste de retour) enregistre la modification en attente.
  useEffect(() => {
    // Remis à vrai à chaque montage (double montage du mode strict)
    alive.current = true;
    const onBeforeUnload = (e) => {
      if (pending.current || inFlight.current > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      alive.current = false;
      // Un seul envoi, qui part même après le départ (client Apollo
      // partagé) : un échec est signalé en nommant la signature
      if (pending.current) flushRef.current();
    };
  }, []);

  return {
    sig,
    setSig,
    update,
    replace,
    flush,
    discard,
    lockEdits,
    editsLocked,
    undo,
    redo,
    canUndo: historyFlags.canUndo,
    canRedo: historyFlags.canRedo,
    status,
    // notFound | forbidden | subscription : plus rien ne s'enregistre
    saveBlocked,
    isSaveBlocked,
    loading: loading && !sig,
    error,
    // Réponse vide sans erreur : signature supprimée, d'un collègue ou d'un
    // autre espace (jamais vrai pendant l'édition, la signature est chargée)
    notFound: !sig && !error && data?.emailSignatureV2 === null,
    refetch,
    catalog,
    initialRender: data?.emailSignatureV2?.render || null,
  };
}
