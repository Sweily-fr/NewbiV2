import { useEffect, useRef, useState } from 'react';
import { useSubscription } from '@apollo/client';
import { useSession } from '@/src/lib/auth-client';
import { COLUMN_UPDATED_SUBSCRIPTION } from '@/src/graphql/kanbanQueries';

/**
 * Hook pour synchroniser les colonnes en temps réel via WebSocket/Redis
 * @param {string} boardId - ID du tableau Kanban
 * @param {string} workspaceId - ID de l'espace de travail
 * @param {Array} localColumns - État local des colonnes
 * @param {Function} setLocalColumns - Fonction pour mettre à jour les colonnes locales
 * @returns {Object} - État de la synchronisation
 */
export function useKanbanRealtimeSync(boardId, workspaceId, localColumns, setLocalColumns) {
  const lastUpdateRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const { data: session, isPending: sessionLoading } = useSession();
  const [isReady, setIsReady] = useState(false);

  // ⚠️ ATTENTION : Ce hook est OBSOLÈTE et ne devrait plus être utilisé
  // Les subscriptions sont gérées dans useKanbanBoard.js
  // Ce fichier est conservé uniquement pour éviter les erreurs d'import
  
  // Attendre que la session soit chargée avant d'activer la subscription
  useEffect(() => {
    if (!sessionLoading && session?.user) {
      console.log('✅ [Realtime] Session chargée, activation subscription');
      setIsReady(true);
    }
  }, [sessionLoading, session]);

  // Subscription pour les mises à jour de colonnes
  const shouldSkip = !boardId || !workspaceId || !isReady || sessionLoading;
  
  const { data: columnData, loading: columnLoading, error: columnError } = useSubscription(
    COLUMN_UPDATED_SUBSCRIPTION,
    {
      variables: { boardId, workspaceId },
      skip: shouldSkip,
    }
  );


  // Gérer les mises à jour de colonnes en temps réel
  useEffect(() => {
    if (!columnData?.columnUpdated) return;

    const { type, column, columns, columnId } = columnData.columnUpdated;
    const now = Date.now();

    // Éviter les boucles infinies - ignorer si on vient de faire une mise à jour
    if (lastUpdateRef.current && now - lastUpdateRef.current < 500) {
      return;
    }

    // Éviter de traiter nos propres mises à jour
    if (isUpdatingRef.current) {
      return;
    }

    // Marquer qu'on a traité une mise à jour
    lastUpdateRef.current = now;

    switch (type) {
      case 'CREATED':
        if (column) {
          setLocalColumns(prev => {
            // Vérifier si la colonne existe déjà
            if (prev.some(c => c.id === column.id)) {
              return prev;
            }
            return [...prev, column].sort((a, b) => a.order - b.order);
          });
        }
        break;

      case 'UPDATED':
        if (column) {
          setLocalColumns(prev =>
            prev.map(c => (c.id === column.id ? { ...c, ...column } : c))
          );
        }
        break;

      case 'DELETED':
        if (columnId) {
          setLocalColumns(prev => prev.filter(c => c.id !== columnId));
        }
        break;

      case 'REORDERED':
        if (columns && Array.isArray(columns)) {
          // Créer un mapping de l'ordre des colonnes
          const orderMap = {};
          columns.forEach((id, index) => {
            orderMap[id] = index;
          });

          // Mettre à jour l'ordre des colonnes locales
          setLocalColumns(prev => {
            const updated = prev.map(col => ({
              ...col,
              order: orderMap[col.id] !== undefined ? orderMap[col.id] : col.order
            }));
            
            // Trier par le nouvel ordre
            return updated.sort((a, b) => a.order - b.order);
          });
        }
        break;

      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnData]);

  // Logger les erreurs de subscription
  useEffect(() => {
    if (columnError) {
      console.error('❌ [Realtime] Erreur subscription colonnes:', columnError);
    }
  }, [columnError]);

  // Fonction pour marquer qu'on est en train de faire une mise à jour
  const markAsUpdating = () => {
    isUpdatingRef.current = true;
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 200);
  };

  return {
    isConnected: !columnLoading && !columnError,
    error: columnError,
    markAsUpdating,
  };
}
