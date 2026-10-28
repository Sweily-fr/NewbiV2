"use client";

import { useCallback, useState } from "react";
import {
  DEFAULT_TIME_ZONE,
  detectTimeZone,
  isValidTimeZone,
} from "@/src/utils/booking";

const STORAGE_KEY = "newbi:rdv:timezone";

function initialTimeZone() {
  if (typeof window === "undefined") return DEFAULT_TIME_ZONE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTimeZone(stored)) return stored;
  } catch {
    // Stockage indisponible (navigation privée, iframe tierce)
  }
  return detectTimeZone();
}

/**
 * Fuseau de l'invité : celui de son navigateur, ou celui qu'il a choisi
 * (gardé dans ce navigateur).
 */
export function useGuestTimeZone() {
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const change = useCallback((zone) => {
    if (!isValidTimeZone(zone)) return;
    setTimeZone(zone);
    try {
      localStorage.setItem(STORAGE_KEY, zone);
    } catch {
      // Choix non retenu
    }
  }, []);
  return [timeZone, change];
}
