"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { useApolloClient } from "@apollo/client";
import { useCacheStats } from "@/src/lib/cache-utils";
import { useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { ChevronDown, ChevronUp, Trash2, RefreshCw, Database } from "lucide-react";

/**
 * Panel de debug pour surveiller et gérer le cache Apollo Client et le cache du layout
 * Affiché uniquement en développement
 */
export function CacheDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const apolloClient = useApolloClient();
  const { getCacheSize, clearCache } = useCacheStats(apolloClient);
  const { cacheInfo, refreshLayoutData, isLoading } = useDashboardLayoutContext();
  const [cacheStats, setCacheStats] = useState(getCacheSize());

  const refreshStats = () => {
    setCacheStats(getCacheSize());
  };

  const handleClearCache = () => {
    clearCache();
    refreshStats();
  };

  const handleRefreshLayoutCache = () => {
    refreshLayoutData();
    refreshStats();
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Jamais';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-background/95 backdrop-blur-sm border-2">
        <CardHeader 
          className="pb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Cache Debug</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Apollo: {cacheStats.entries}
              </Badge>
              <Badge 
                variant={cacheInfo?.isFromCache ? "default" : "secondary"} 
                className="text-xs"
              >
                Layout: {cacheInfo?.isFromCache ? 'Cache' : 'Fresh'}
              </Badge>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Apollo Cache Stats */}
              <div>
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Database size={12} />
                  Apollo Cache
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Entrées:</span>
                    <div className="font-mono">{cacheStats.entries}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taille:</span>
                    <div className="font-mono">{cacheStats.sizeKB} KB</div>
                  </div>
                </div>
              </div>

              {/* Layout Cache Stats */}
              <div>
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                  <RefreshCw size={12} />
                  Layout Cache
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge 
                      variant={cacheInfo?.isFromCache ? "default" : "secondary"}
                      className="text-xs h-4"
                    >
                      {cacheInfo?.isFromCache ? 'En cache' : 'Frais'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernière MAJ:</span>
                    <span className="font-mono">{formatLastUpdate(cacheInfo?.lastUpdate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chargement:</span>
                    <Badge 
                      variant={isLoading ? "destructive" : "default"}
                      className="text-xs h-4"
                    >
                      {isLoading ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshStats}
                    className="flex-1"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Stats
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshLayoutCache}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Database size={14} className="mr-1" />
                    Layout
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearCache}
                  className="w-full"
                >
                  <Trash2 size={14} className="mr-1" />
                  Vider Apollo Cache
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
