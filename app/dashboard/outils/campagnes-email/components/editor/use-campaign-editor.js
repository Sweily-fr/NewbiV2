"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import {
  GET_EMAIL_CAMPAIGN,
  UPDATE_EMAIL_CAMPAIGN,
} from "@/src/graphql/emailCampaignQueries";
import { normalizeDesign } from "@/src/utils/email-campaign-design";

const SAVE_DELAY_MS = 1500;
const HISTORY_LIMIT = 100;
// Modifications successives d'un même champ (frappe) : un seul retour
// arrière les annule toutes
const COALESCE_MS = 1200;

const errorCode = (error) => error?.graphQLErrors?.[0]?.extensions?.code;

/**
 * État de l'éditeur d'une campagne : design (avec historique Annuler /
 * Rétablir), nom, et enregistrement automatique (1,5 s après la dernière
 * modification). Le design initial est lu une fois : les réponses de l'API
 * ne remplacent jamais une saisie en cours.
 */
export function useCampaignEditor({
  campaign,
  workspaceId,
  readOnly,
  onSaveError,
}) {
  const client = useApolloClient();
  const initial = useRef(null);
  if (!initial.current) {
    initial.current = {
      design: normalizeDesign(campaign.design),
      name: campaign.name,
    };
  }

  const onSaveErrorRef = useRef(onSaveError);
  onSaveErrorRef.current = onSaveError;
  const designRef = useRef(initial.current.design);
  const nameRef = useRef(initial.current.name);
  const [design, setDesignState] = useState(initial.current.design);
  const [name, setNameState] = useState(initial.current.name);
  const history = useRef({ past: [], future: [], key: null, at: 0 });
  const [historySize, setHistorySize] = useState({ past: 0, future: 0 });

  // ── Enregistrement ────────────────────────────────────────────────────
  const savedSnapshot = useRef(JSON.stringify(initial.current));
  const timer = useRef(null);
  const inflight = useRef(null);
  const [status, setStatus] = useState("idle");
  const [saveError, setSaveError] = useState(null);
  const [blocked, setBlocked] = useState(false);

  const snapshot = () =>
    JSON.stringify({ design: designRef.current, name: nameRef.current });

  const save = useCallback(async () => {
    if (readOnly || blocked) return true;
    if (inflight.current) {
      await inflight.current;
    }
    const current = snapshot();
    if (current === savedSnapshot.current) {
      setStatus((value) => (value === "idle" ? "idle" : "saved"));
      return true;
    }
    const { design: sentDesign, name: sentName } = JSON.parse(current);
    setStatus("saving");
    const request = client
      .mutate({
        mutation: UPDATE_EMAIL_CAMPAIGN,
        variables: {
          workspaceId,
          id: campaign.id,
          input: { design: sentDesign, name: sentName.trim() || campaign.name },
        },
        errorPolicy: "none",
      })
      .then(
        () => {
          savedSnapshot.current = current;
          setSaveError(null);
          // Modifié pendant l'envoi : le reste part au prochain tour
          setStatus(snapshot() === current ? "saved" : "dirty");
          return true;
        },
        async (error) => {
          setSaveError(error);
          setStatus("error");
          const code = errorCode(error);
          if (code === "FORBIDDEN" || code === "NOT_FOUND") {
            setBlocked(true);
          } else if (code === "VALIDATION_ERROR" || code === "BAD_USER_INPUT") {
            // Contenu refusé (trop de blocs…) ou campagne partie entre-temps :
            // seul le second cas fige l'éditeur
            const fresh = await client
              .query({
                query: GET_EMAIL_CAMPAIGN,
                variables: { workspaceId, id: campaign.id },
                fetchPolicy: "network-only",
              })
              .catch(() => null);
            const status = fresh?.data?.emailCampaign?.status;
            if (status && status !== "DRAFT") setBlocked(true);
          }
          onSaveErrorRef.current?.(error);
          return false;
        },
      );
    inflight.current = request;
    const ok = await request;
    inflight.current = null;
    if (ok && snapshot() !== savedSnapshot.current) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => save(), SAVE_DELAY_MS);
    }
    return ok;
    // campaign.id / workspaceId fixes pour une page d'éditeur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, workspaceId, campaign.id, readOnly, blocked]);

  const schedule = useCallback(() => {
    if (readOnly) return;
    setStatus("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(), SAVE_DELAY_MS);
  }, [readOnly, save]);

  /** Enregistre tout de suite ce qui attend ; false si ça n'a pas pu partir. */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (readOnly) return true;
    if (inflight.current) await inflight.current;
    if (snapshot() === savedSnapshot.current) return true;
    return save();
  }, [readOnly, save]);

  // Départ de la page : ce qui attend part quand même
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (!readOnly && snapshot() !== savedSnapshot.current) save();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Fermeture de l'onglet avec une modification non enregistrée
  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (readOnly || snapshot() === savedSnapshot.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [readOnly]);

  // ── Historique ────────────────────────────────────────────────────────
  const syncHistorySize = () =>
    setHistorySize({
      past: history.current.past.length,
      future: history.current.future.length,
    });

  /**
   * Nouveau design (valeur ou fonction du design courant). `coalesce` :
   * clé d'une saisie continue (même champ) regroupée dans l'historique.
   */
  const commit = useCallback(
    (next, { coalesce } = {}) => {
      if (readOnly) return;
      const previous = designRef.current;
      const value = typeof next === "function" ? next(previous) : next;
      if (!value || value === previous) return;
      const h = history.current;
      const now = Date.now();
      const merge = coalesce && h.key === coalesce && now - h.at < COALESCE_MS;
      if (!merge) {
        h.past.push(previous);
        if (h.past.length > HISTORY_LIMIT) h.past.shift();
      }
      h.future = [];
      h.key = coalesce || null;
      h.at = now;
      designRef.current = value;
      setDesignState(value);
      syncHistorySize();
      schedule();
    },
    [readOnly, schedule],
  );

  const undo = useCallback(() => {
    const h = history.current;
    if (readOnly || !h.past.length) return;
    h.future.push(designRef.current);
    const previous = h.past.pop();
    h.key = null;
    designRef.current = previous;
    setDesignState(previous);
    syncHistorySize();
    schedule();
  }, [readOnly, schedule]);

  const redo = useCallback(() => {
    const h = history.current;
    if (readOnly || !h.future.length) return;
    h.past.push(designRef.current);
    const next = h.future.pop();
    h.key = null;
    designRef.current = next;
    setDesignState(next);
    syncHistorySize();
    schedule();
  }, [readOnly, schedule]);

  const setName = useCallback(
    (value) => {
      if (readOnly) return;
      nameRef.current = value;
      setNameState(value);
      schedule();
    },
    [readOnly, schedule],
  );

  return {
    design,
    designRef,
    commit,
    undo,
    redo,
    canUndo: historySize.past > 0,
    canRedo: historySize.future > 0,
    name,
    setName,
    status,
    saveError,
    blocked,
    flush,
    retry: save,
  };
}
