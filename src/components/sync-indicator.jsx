import React from 'react';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

/**
 * Composant d'indicateur de synchronisation en temps réel
 */
export const SyncIndicator = ({
  isPolling = false,
  syncStatus = 'idle',
  lastUpdate = null,
  currentInterval = 5000,
  onForceSync = null,
  className = '',
  showDetails = false,
}) => {
  // Formatage de la dernière mise à jour
  const formatLastUpdate = (date) => {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `Il y a ${diff}s`;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`;
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Formatage de l'intervalle
  const formatInterval = (ms) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}min`;
  };

  // Configuration selon le statut
  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Synchronisation...',
          animate: true,
        };
      case 'error':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Erreur de sync',
          animate: false,
        };
      case 'idle':
      default:
        return {
          icon: isPolling ? Wifi : CheckCircle2,
          color: isPolling ? 'text-green-500' : 'text-gray-400',
          bgColor: isPolling ? 'bg-green-50' : 'bg-gray-50',
          borderColor: isPolling ? 'border-green-200' : 'border-gray-200',
          label: isPolling ? 'En ligne' : 'Hors ligne',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  // Version compacte (par défaut)
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-200",
              config.bgColor,
              config.borderColor,
              className
            )}>
              <IconComponent 
                className={cn(
                  "h-3 w-3",
                  config.color,
                  config.animate && "animate-spin"
                )} 
              />
              {onForceSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={onForceSync}
                  disabled={syncStatus === 'syncing'}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-1">
              <div className="font-medium">{config.label}</div>
              <div className="text-muted-foreground">
                Dernière sync: {formatLastUpdate(lastUpdate)}
              </div>
              <div className="text-muted-foreground">
                Intervalle: {formatInterval(currentInterval)}
              </div>
              {onForceSync && (
                <div className="text-muted-foreground">
                  Cliquez pour forcer la synchronisation
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Version détaillée
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-center gap-2">
        <IconComponent 
          className={cn(
            "h-4 w-4",
            config.color,
            config.animate && "animate-spin"
          )} 
        />
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>
      </div>

      <div className="flex-1 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Dernière sync: {formatLastUpdate(lastUpdate)}</span>
        </div>
        <div>Intervalle: {formatInterval(currentInterval)}</div>
      </div>

      {onForceSync && (
        <Button
          variant="outline"
          size="sm"
          onClick={onForceSync}
          disabled={syncStatus === 'syncing'}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className={cn(
            "h-3 w-3 mr-1",
            syncStatus === 'syncing' && "animate-spin"
          )} />
          Sync
        </Button>
      )}
    </div>
  );
};

export default SyncIndicator;
