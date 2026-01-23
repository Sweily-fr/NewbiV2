"use client";

import { useEffect, useState } from "react";
import { Clock, Euro } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

/**
 * Composant pour afficher le timer et le prix calculé dans la TaskCard
 * @param {Object} timeTracking - Données du timer (totalSeconds, isRunning, currentStartTime, hourlyRate, roundingOption)
 */
export function TimerDisplay({ timeTracking }) {
  const [currentTime, setCurrentTime] = useState(0);

  // Calculer le temps total en secondes (incluant le temps en cours si le timer est actif)
  useEffect(() => {
    if (!timeTracking) return;

    const updateTime = () => {
      let total = timeTracking.totalSeconds || 0;
      
      // Si le timer est en cours, ajouter le temps écoulé depuis le démarrage
      if (timeTracking.isRunning && timeTracking.currentStartTime) {
        const startTime = new Date(timeTracking.currentStartTime);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        // Protection contre les valeurs négatives (problème de fuseau horaire)
        if (elapsedSeconds > 0) {
          total += elapsedSeconds;
        }
      }
      
      // S'assurer que le total n'est jamais négatif
      setCurrentTime(Math.max(0, total));
    };

    // Mettre à jour immédiatement
    updateTime();

    // Si le timer est actif, mettre à jour chaque seconde
    if (timeTracking.isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timeTracking]);

  // Formater le temps avec logique d'affichage
  // Si >= 1h : afficher h + min
  // Si < 1h : afficher min + sec
  const formatTime = (seconds) => {
    // Protection contre les valeurs négatives
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    if (hours >= 1) {
      // Afficher heures + minutes
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    } else {
      // Afficher minutes + secondes
      return `${minutes}m${secs.toString().padStart(2, '0')}`;
    }
  };

  // Calculer le prix basé sur le temps et le tarif horaire
  const calculatePrice = () => {
    if (!timeTracking?.hourlyRate || currentTime <= 0) return null;

    const hours = Math.max(0, currentTime) / 3600;
    const roundingOption = timeTracking.roundingOption || 'none';
    
    let billableHours = hours;
    
    // Appliquer l'arrondi selon l'option choisie
    if (roundingOption === 'up') {
      billableHours = Math.ceil(hours);
    } else if (roundingOption === 'down') {
      billableHours = Math.floor(hours);
    }
    // Si 'none', on garde les heures exactes avec conversion proportionnelle
    
    const price = billableHours * timeTracking.hourlyRate;
    return price.toFixed(2);
  };

  // Ne rien afficher si pas de timeTracking ou pas de temps enregistré
  if (!timeTracking || currentTime === 0) return null;

  const price = calculatePrice();
  const isRunning = timeTracking.isRunning;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md ${
          isRunning ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground'
        }`}
      >
        <Clock className={`h-3.5 w-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
        <span>{formatTime(currentTime)}</span>
      </Badge>
      
      {price && (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1 py-1 px-2.5 text-xs font-medium rounded-md text-muted-foreground"
        >
          <Euro className="h-3.5 w-3.5" />
          <span>{price}€</span>
        </Badge>
      )}
    </div>
  );
}
