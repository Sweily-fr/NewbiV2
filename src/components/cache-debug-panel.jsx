"use client";

import { useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { useCacheStats, invalidateCache } from '@/src/lib/cache-utils';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Activity, 
  HardDrive,
  Eye,
  EyeOff 
} from 'lucide-react';
import { toast } from '@/src/components/ui/sonner';

/**
 * Composant de debug pour surveiller et gérer le cache Apollo Client
 * Utile en développement pour diagnostiquer les problèmes de performance
 */
export const CacheDebugPanel = ({ className = "" }) => {
  const apolloClient = useApolloClient();
  const { getCacheSize, clearCache } = useCacheStats(apolloClient);
  const [isVisible, setIsVisible] = useState(false);
  const [cacheStats, setCacheStats] = useState({ entries: 0, size: 0, sizeKB: 0 });
  const [cacheData, setCacheData] = useState({});
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Mettre à jour les stats du cache
  const updateStats = () => {
    const stats = getCacheSize();
    setCacheStats(stats);
    
    try {
      const data = apolloClient.cache.extract();
      setCacheData(data);
    } catch (error) {
      console.warn('Erreur extraction cache:', error);
    }
  };

  useEffect(() => {
    updateStats();
    
    // Mettre à jour les stats toutes les 5 secondes si visible
    let interval;
    if (isVisible) {
      interval = setInterval(updateStats, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible, apolloClient]);

  // Fonctions de gestion du cache
  const handleClearCache = () => {
    clearCache();
    updateStats();
    toast.success('Cache Apollo vidé complètement');
  };

  const handleInvalidateSpecific = (patterns) => {
    invalidateCache(apolloClient, patterns);
    updateStats();
    toast.success(`Cache invalidé pour: ${patterns.join(', ')}`);
  };

  const handleRefreshQueries = async () => {
    try {
      await apolloClient.refetchQueries({ include: 'active' });
      updateStats();
      toast.success('Toutes les requêtes actives ont été actualisées');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    }
  };

  // Analyser les types de données en cache
  const analyzeCacheData = () => {
    const analysis = {
      queries: 0,
      entities: 0,
      types: new Set(),
      largestEntries: [],
    };

    Object.entries(cacheData).forEach(([key, value]) => {
      if (key.startsWith('ROOT_QUERY')) {
        analysis.queries++;
      } else {
        analysis.entities++;
        if (value.__typename) {
          analysis.types.add(value.__typename);
        }
      }

      // Calculer la taille de l'entrée
      const entrySize = JSON.stringify(value).length;
      analysis.largestEntries.push({ key, size: entrySize, data: value });
    });

    // Trier par taille
    analysis.largestEntries.sort((a, b) => b.size - a.size);
    analysis.largestEntries = analysis.largestEntries.slice(0, 10);

    return analysis;
  };

  const cacheAnalysis = analyzeCacheData();

  // Formater la taille en bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Database className="h-4 w-4 mr-2" />
          Cache Debug
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-96 ${className}`}>
      <Card className="bg-background/95 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Cache Apollo Debug
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Statistiques générales */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Entrées:</span>
              <Badge variant="secondary">{cacheStats.entries}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Taille:</span>
              <Badge variant="secondary">{formatBytes(cacheStats.size)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Requêtes:</span>
              <Badge variant="outline">{cacheAnalysis.queries}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Entités:</span>
              <Badge variant="outline">{cacheAnalysis.entities}</Badge>
            </div>
          </div>

          <Separator />

          {/* Types d'entités */}
          <div>
            <h4 className="text-sm font-medium mb-2">Types en cache:</h4>
            <div className="flex flex-wrap gap-1">
              {Array.from(cacheAnalysis.types).map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions de gestion */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Actions:</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRefreshQueries}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Actualiser
              </Button>
              
              <Button
                onClick={handleClearCache}
                variant="outline"
                size="sm"
                className="text-xs text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Vider tout
              </Button>
            </div>

            {/* Actions spécifiques */}
            <div className="space-y-1">
              <Button
                onClick={() => handleInvalidateSpecific(['getInvoices', 'getQuotes'])}
                variant="ghost"
                size="sm"
                className="w-full text-xs justify-start"
              >
                Invalider Factures/Devis
              </Button>
              
              <Button
                onClick={() => handleInvalidateSpecific(['getClients', 'getProducts'])}
                variant="ghost"
                size="sm"
                className="w-full text-xs justify-start"
              >
                Invalider Clients/Produits
              </Button>
              
              <Button
                onClick={() => handleInvalidateSpecific(['getActiveOrganization'])}
                variant="ghost"
                size="sm"
                className="w-full text-xs justify-start"
              >
                Invalider Organisation
              </Button>
            </div>
          </div>

          <Separator />

          {/* Entrées les plus volumineuses */}
          <div>
            <h4 className="text-sm font-medium mb-2">Plus gros éléments:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {cacheAnalysis.largestEntries.slice(0, 5).map((entry, index) => (
                <div 
                  key={entry.key}
                  className="flex items-center justify-between text-xs p-1 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <span className="truncate flex-1 mr-2">
                    {entry.key.replace('ROOT_QUERY.', '').substring(0, 20)}...
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {formatBytes(entry.size)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateur de performance */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Performance:</span>
            <div className="flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              <Badge 
                variant={cacheStats.sizeKB > 1000 ? "destructive" : cacheStats.sizeKB > 500 ? "secondary" : "default"}
              >
                {cacheStats.sizeKB > 1000 ? "Lourd" : cacheStats.sizeKB > 500 ? "Moyen" : "Léger"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal pour afficher les détails d'une entrée */}
      {selectedEntry && (
        <Card className="mt-2 bg-background/95 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium">Détails de l'entrée</CardTitle>
              <Button
                onClick={() => setSelectedEntry(null)}
                variant="ghost"
                size="sm"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs">
              <p className="font-medium mb-1">Clé: {selectedEntry.key}</p>
              <p className="text-muted-foreground mb-2">
                Taille: {formatBytes(selectedEntry.size)}
              </p>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(selectedEntry.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CacheDebugPanel;
