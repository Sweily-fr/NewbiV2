# Plan de Migration vers WebSockets

## Pourquoi Migrer ?

### Limites du Polling (à grande échelle)
- **Latence** : 2-30 secondes de délai
- **Charge serveur** : Requêtes constantes même sans changements
- **Bande passante** : Données complètes à chaque requête
- **Batterie mobile** : Impact sur l'autonomie

### Avantages des WebSockets
- **Temps réel** : Mises à jour instantanées (<100ms)
- **Efficacité** : Pas de requêtes inutiles
- **Bidirectionnel** : Communication dans les deux sens
- **Économie** : Moins de bande passante et de batterie

## Architecture WebSocket Proposée

### Backend (Node.js + Socket.io)

```javascript
// server.js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware d'authentification
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await validateJWT(token);
    socket.userId = user.id;
    socket.workspaceId = user.workspaceId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Gestion des connexions
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Rejoindre la room du workspace
  socket.join(`workspace:${socket.workspaceId}`);
  
  // Écouter les événements Kanban
  socket.on('kanban:subscribe', (boardId) => {
    socket.join(`board:${boardId}`);
  });
  
  socket.on('kanban:unsubscribe', (boardId) => {
    socket.leave(`board:${boardId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Émission lors de changements
const emitKanbanUpdate = (workspaceId, boardId, action, data) => {
  io.to(`workspace:${workspaceId}`).emit('kanban:update', {
    boardId,
    action, // 'create', 'update', 'delete'
    data,
    timestamp: new Date()
  });
};
```

### Frontend (React + Socket.io-client)

```javascript
// hooks/useWebSocketKanban.js
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const useWebSocketKanban = ({ workspaceId, onUpdate }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken || !workspaceId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: {
        token: session.accessToken
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('kanban:update', (update) => {
      if (onUpdate) {
        onUpdate(update);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session, workspaceId, onUpdate]);

  const subscribeToBoard = useCallback((boardId) => {
    if (socket) {
      socket.emit('kanban:subscribe', boardId);
    }
  }, [socket]);

  const unsubscribeFromBoard = useCallback((boardId) => {
    if (socket) {
      socket.emit('kanban:unsubscribe', boardId);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    subscribeToBoard,
    unsubscribeFromBoard
  };
};
```

## Plan de Migration Progressive

### Étape 1 : Infrastructure WebSocket
- [ ] Installer Socket.io sur le backend
- [ ] Configurer l'authentification WebSocket
- [ ] Créer les rooms par workspace/board
- [ ] Tests de connexion de base

### Étape 2 : Implémentation Kanban
- [ ] Hook useWebSocketKanban
- [ ] Émission d'événements depuis les resolvers
- [ ] Gestion des reconnexions automatiques
- [ ] Fallback vers polling en cas d'échec

### Étape 3 : Optimisations
- [ ] Compression des messages
- [ ] Batching des événements
- [ ] Gestion de la charge (rate limiting)
- [ ] Monitoring et métriques

### Étape 4 : Extension
- [ ] Autres outils (factures, clients, etc.)
- [ ] Curseurs temps réel
- [ ] Notifications push
- [ ] Collaboration avancée

## Comparaison Performance

| Métrique | Polling Actuel | WebSocket |
|----------|----------------|-----------|
| Latence | 2-30 secondes | <100ms |
| Requêtes/min (100 users) | ~200 | ~0 |
| Bande passante | Élevée | Faible |
| Charge serveur | Moyenne | Faible |
| Complexité | Simple | Moyenne |
| Temps réel | Non | Oui |

## Stratégie de Déploiement

### Phase de Transition
```javascript
// Système hybride pendant la migration
const useRealTimeSystem = ({ enableWebSocket = false }) => {
  if (enableWebSocket && isWebSocketSupported()) {
    return useWebSocketKanban(props);
  } else {
    return useRealTimePolling(props);
  }
};
```

### Feature Flag
```javascript
// Activation progressive par pourcentage d'utilisateurs
const shouldUseWebSocket = () => {
  const userId = getCurrentUserId();
  const hash = simpleHash(userId);
  return (hash % 100) < WEBSOCKET_ROLLOUT_PERCENTAGE;
};
```

## Monitoring et Métriques

### Métriques Clés
- Temps de connexion WebSocket
- Taux de reconnexion
- Latence des messages
- Nombre de connexions simultanées
- Charge CPU/Mémoire serveur

### Alertes
- Connexions WebSocket échouées > 5%
- Latence moyenne > 500ms
- Reconnexions > 10/minute/user
- Charge serveur > 80%

## Coûts et ROI

### Coûts de Développement
- **Backend WebSocket** : ~2-3 jours
- **Frontend Integration** : ~2-3 jours
- **Tests et Optimisations** : ~2-3 jours
- **Total** : ~1-2 semaines

### Bénéfices Attendus
- **Performance** : 10x plus rapide
- **Charge serveur** : -80% de requêtes
- **UX** : Collaboration temps réel
- **Scalabilité** : Support de milliers d'utilisateurs

## Recommandation

### Court Terme (Maintenant)
✅ **Garder le système de polling actuel**
- Déjà optimisé pour vos besoins actuels
- Stable et testé
- Suffisant pour <500 utilisateurs simultanés

### Moyen Terme (6-12 mois)
🔄 **Migrer vers WebSockets si :**
- Plus de 500 utilisateurs simultanés
- Besoin de collaboration temps réel avancée
- Problèmes de performance observés

### Long Terme (1-2 ans)
🚀 **WebSockets + Fonctionnalités Avancées**
- Curseurs temps réel
- Édition collaborative
- Notifications push
- Synchronisation offline
