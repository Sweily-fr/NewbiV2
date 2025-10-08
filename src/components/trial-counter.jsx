"use client";

import React, { useState, useEffect } from "react";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";

/**
 * Composant compteur de période d'essai qui s'affiche à côté du bouton de thème
 * Format: "Essais + date + 0d:00:00:00"
 */
export function TrialCounter() {
  const { user, trial } = useDashboardLayoutContext();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculer le temps restant en temps réel
  useEffect(() => {
    if (!trial?.trialStatus?.trialEndDate || !trial?.isTrialActive) {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();

      // Gérer différents formats de date pour trialEndDate
      let endDate;
      const trialEndDateValue = trial.trialStatus.trialEndDate;

      if (
        typeof trialEndDateValue === "string" &&
        /^\d+$/.test(trialEndDateValue)
      ) {
        // Timestamp en string
        endDate = new Date(parseInt(trialEndDateValue));
      } else if (typeof trialEndDateValue === "number") {
        // Timestamp en number
        endDate = new Date(trialEndDateValue);
      } else {
        // Format ISO string ou autre
        endDate = new Date(trialEndDateValue);
      }

      // Vérifier si la date est valide
      if (isNaN(endDate.getTime())) {
        console.error("Date de fin d'essai invalide:", trialEndDateValue);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const diffTime = endDate - now;

      if (diffTime <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Calculer immédiatement
    calculateTimeLeft();

    // Mettre à jour chaque seconde
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trial?.trialStatus?.trialEndDate, trial?.isTrialActive]);

  // Ne pas afficher si pas connecté ou pas de trial actif
  if (!user || !trial?.isTrialActive || !trial?.trialStatus?.trialEndDate) {
    return null;
  }

  // Formater la date de fin d'essai
  const formatDate = (dateString) => {
    if (!dateString) return "Date invalide";

    let date;

    // Essayer différents formats de date
    if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
      // Si c'est un timestamp en string, le convertir en number
      date = new Date(parseInt(dateString));
    } else if (typeof dateString === "number") {
      // Si c'est déjà un number
      date = new Date(dateString);
    } else {
      // Format ISO string ou autre
      date = new Date(dateString);
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error(
        "Date invalide dans trial counter:",
        dateString,
        "Type:",
        typeof dateString
      );
      return "Date invalide";
    }

    // Vérifier si la date est dans une plage raisonnable (entre 2020 et 2030)
    const year = date.getFullYear();
    if (year < 2020 || year > 2030) {
      console.error(
        "Date hors plage dans trial counter:",
        dateString,
        "Année:",
        year
      );
      return "Date invalide";
    }

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-normal text-[#5A50FF]">Essais</span>
      <div
        className="flex items-center divide-x rounded-md text-xs tabular-nums text-[#5A50FF]"
        style={{ backgroundColor: "#5A50FF15", borderColor: "#5A50FF40" }}
      >
        {timeLeft.days > 0 && (
          <span className="flex h-6 items-center justify-center px-1.5">
            {timeLeft.days}
            <span className="opacity-60">j</span>
          </span>
        )}
        <span className="flex h-6 items-center justify-center px-1.5">
          {timeLeft.hours.toString().padStart(2, "0")}
          <span className="opacity-60">h</span>
        </span>
        <span className="flex h-6 items-center justify-center px-1.5">
          {timeLeft.minutes.toString().padStart(2, "0")}
          <span className="opacity-60">m</span>
        </span>
        <span className="flex h-6 items-center justify-center px-1.5">
          {timeLeft.seconds.toString().padStart(2, "0")}
          <span className="opacity-60">s</span>
        </span>
      </div>
    </div>
  );
}
