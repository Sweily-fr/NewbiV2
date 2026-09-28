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

const SAVE_DELAY_MS = 800;

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
 */
export function useSignatureV2(id) {
  const [sig, setSig] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | dirty | saving | saved | error
  const timer = useRef(null);
  const pending = useRef(null);
  const hydratedId = useRef(null);

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
      setStatus("idle");
    }
  }, [data]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const toSave = pending.current;
    if (!toSave) return;
    pending.current = null;
    setStatus("saving");
    try {
      const { data: saved } = await updateMutation({
        variables: { id, input: toInput(toSave) },
      });
      const server = saved?.updateEmailSignatureV2;
      if (server) {
        // Réaligne les champs normalisés (couleurs, bornes) sans toucher à
        // une modification arrivée entre-temps.
        setSig((current) =>
          pending.current ? current : { ...current, ...server, images: server.images },
        );
      }
      setStatus(pending.current ? "dirty" : "saved");
    } catch (err) {
      setStatus("error");
      const message = err?.graphQLErrors?.[0]?.message || err?.message || "";
      toast.error(
        /existe/i.test(message)
          ? "Ce nom de signature est déjà utilisé"
          : "Enregistrement impossible, vérifiez votre connexion",
      );
    }
  }, [id, updateMutation]);

  const update = useCallback(
    (patch) => {
      setSig((prev) => {
        if (!prev) return prev;
        const next = merge(prev, patch);
        pending.current = next;
        return next;
      });
      setStatus("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  /** Remplace la signature locale par une réponse serveur (après un upload). */
  const replace = useCallback((server) => {
    if (!server) return;
    setSig((current) => ({ ...current, ...server, images: server.images }));
  }, []);

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
    status,
    loading: loading && !sig,
    error,
    refetch,
    catalog,
    initialRender: data?.emailSignatureV2?.render || null,
  };
}
