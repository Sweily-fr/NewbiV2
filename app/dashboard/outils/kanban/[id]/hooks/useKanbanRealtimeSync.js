import { useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client';
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

  // Log des paramètres au montage
  useEffect(() => {
    console.log('🔧 [Realtime] Hook initialisé avec:', {
      boardId,
      workspaceId,
      columnsCount: localColumns?.length
    });
  }, [boardId, workspaceId, localColumns?.length]);

  // Subscription pour les mises à jour de colonnes
  const { data: columnData, loading: columnLoading, error: columnError } = useSubscription(
    COLUMN_UPDATED_SUBSCRIPTION,
    {
      variables: { boardId, workspaceId },
      skip: !boardId || !workspaceId,
      onSubscriptionData: ({ subscriptionData }) => {
        console.log('📡 [Realtime] Événement colonne reçu:', subscriptionData);
      },
    }
  );

  // Logger l'état de la subscription
  useEffect(() => {
    console.log('📊 [Realtime] État subscription:', {
      loading: columnLoading,
      hasData: !!columnData,
      hasError: !!columnError,
      skip: !boardId || !workspaceId
    });
  }, [columnLoading, columnData, columnError, boardId, workspaceId]);

  // Gérer les mises à jour de colonnes en temps réel
  useEffect(() => {
    console.log('🔍 [Realtime] useEffect déclenché, columnData:', columnData);
    
    if (!columnData?.columnUpdated) {
      console.log('⚠️ [Realtime] Pas de données columnUpdated');
      return;
    }

    const { type, column, columns, columnId } = columnData.columnUpdated;
    const now = Date.now();

    console.log('📦 [Realtime] Données reçues:', {
      type,
      hasColumn: !!column,
      hasColumns: !!columns,
      columnsArray: columns,
      columnId,
      isUpdating: isUpdatingRef.current,
      lastUpdate: lastUpdateRef.current,
      timeSinceLastUpdate: lastUpdateRef.current ? now - lastUpdateRef.current : null
    });

    // Éviter les boucles infinies - ignorer si on vient de faire une mise à jour
    if (lastUpdateRef.current && now - lastUpdateRef.current < 500) {
      console.log('⏭️ [Realtime] Mise à jour ignorée (trop récente)');
      return;
    }

    // Éviter de traiter nos propres mises à jour
    if (isUpdatingRef.current) {
      console.log('⏭️ [Realtime] Mise à jour ignorée (en cours)');
      return;
    }

    console.log(`🔄 [Realtime] Traitement événement: ${type}`);

    switch (type) {
      case 'CREATED':
        if (column) {
          console.log('➕ [Realtime] Ajout colonne:', column.title);
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
          console.log('✏️ [Realtime] Mise à jour colonne:', column.title);
          setLocalColumns(prev =>
            prev.map(c => (c.id === column.id ? { ...c, ...column } : c))
          );
        }
        break;

      case 'DELETED':
        if (columnId) {
          console.log('🗑️ [Realtime] Suppression colonne:', columnId);
          setLocalColumns(prev => prev.filter(c => c.id !== columnId));
        }
        break;

      case 'REORDERED':
        if (columns && Array.isArray(columns)) {
          console.log('🔀 [Realtime] Réorganisation colonnes:', columns);
          
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

          lastUpdateRef.current = now;
        }
        break;

      default:
        console.warn('⚠️ [Realtime] Type d\'événement inconnu:', type);
    }
  }, [columnData, setLocalColumns]);

  // Logger les erreurs de subscription
  useEffect(() => {
    if (columnError) {
      console.error('❌ [Realtime] Erreur subscription colonnes:', columnError);
    }
  }, [columnError]);

  // Fonction pour marquer qu'on est en train de faire une mise à jour
  const markAsUpdating = () => {
    isUpdatingRef.current = true;
    console.log('🔒 [Realtime] Blocage temporaire activé');
    setTimeout(() => {
      isUpdatingRef.current = false;
      console.log('🔓 [Realtime] Blocage temporaire désactivé');
    }, 200); // Réduit à 200ms au lieu de 1000ms
  };

  return {
    isConnected: !columnLoading && !columnError,
    error: columnError,
    markAsUpdating,
  };
}
