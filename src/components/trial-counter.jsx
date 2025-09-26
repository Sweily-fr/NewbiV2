"use client";

import React, { useState, useEffect } from "react";
import { useTrial } from "@/src/hooks/useTrial";
import { useSession } from "@/src/lib/auth-client";

/**
 * Composant compteur de période d'essai qui s'affiche à côté du bouton de thème
 * Format: "Essais + date + 0d:00:00:00"
 */
export function TrialCounter() {
  const { data: session } = useSession();
  const { trialStatus, isTrialActive, daysRemaining } = useTrial();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculer le temps restant en temps réel
  useEffect(() => {
    if (!trialStatus?.trialEndDate || !isTrialActive) {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Gérer différents formats de date pour trialEndDate
      let endDate;
      const trialEndDateValue = trialStatus.trialEndDate;
      
      if (typeof trialEndDateValue === 'string' && /^\d+$/.test(trialEndDateValue)) {
        // Timestamp en string
        endDate = new Date(parseInt(trialEndDateValue));
      } else if (typeof trialEndDateValue === 'number') {
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
      const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Calculer immédiatement
    calculateTimeLeft();

    // Mettre à jour chaque seconde
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialStatus?.trialEndDate, isTrialActive]);

  // Ne pas afficher si pas connecté ou pas de trial actif
  if (!session?.user || !isTrialActive || !trialStatus?.trialEndDate) {
    return null;
  }

  // Formater la date de fin d'essai
  const formatDate = (dateString) => {
    if (!dateString) return "Date invalide";
    
    let date;
    
    // Essayer différents formats de date
    if (typeof dateString === 'string' && /^\d+$/.test(dateString)) {
      // Si c'est un timestamp en string, le convertir en number
      date = new Date(parseInt(dateString));
    } else if (typeof dateString === 'number') {
      // Si c'est déjà un number
      date = new Date(dateString);
    } else {
      // Format ISO string ou autre
      date = new Date(dateString);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error("Date invalide dans trial counter:", dateString, "Type:", typeof dateString);
      return "Date invalide";
    }
    
    // Vérifier si la date est dans une plage raisonnable (entre 2020 et 2030)
    const year = date.getFullYear();
    if (year < 2020 || year > 2030) {
      console.error("Date hors plage dans trial counter:", dateString, "Année:", year);
      return "Date invalide";
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formater le compteur avec padding
  const formatTime = (time) => {
    return `${time.days}d:${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded-md border" style={{
      backgroundColor: '#5b50FF10',
      borderColor: '#5b50FF40',
      color: '#5b50FF'
    }}>
      <span className="font-medium">Essais</span>
      <span className="opacity-70">
        {formatDate(trialStatus.trialEndDate)}
      </span>
      <span className="font-bold tabular-nums">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
