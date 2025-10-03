# Installation des dépendances WebSocket pour les subscriptions GraphQL

## Dépendances à installer côté frontend (NewbiV2)

```bash
cd NewbiV2
npm install @apollo/client graphql-ws
```

## Dépendances à installer côté backend (newbi-api)

```bash
cd newbi-api
npm install graphql-subscriptions graphql-ws ws
```

## Variables d'environnement à ajouter

### Frontend (.env.local)
```env
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
```

### Backend (.env)
```env
# Déjà configuré normalement
GRAPHQL_ENDPOINT=http://localhost:4000/graphql
```

## Configuration serveur WebSocket (backend)

Le serveur GraphQL doit être configuré pour supporter les WebSockets. Vérifiez que votre serveur GraphQL supporte les subscriptions avec `graphql-ws`.

## Test de fonctionnement

1. Démarrer le backend avec support WebSocket
2. Démarrer le frontend
3. Ouvrir deux onglets sur la page Kanban
4. Créer/modifier/supprimer un tableau dans un onglet
5. Vérifier que l'autre onglet se met à jour automatiquement

## Fonctionnalités implémentées

✅ **Backend:**
- Subscriptions GraphQL pour boards, tasks, columns
- Publication d'événements lors des mutations
- Filtrage par workspace et board
- Authentification WebSocket avec JWT

✅ **Frontend:**
- Configuration Apollo Client avec WebSocket split
- Hook useKanbanBoards avec subscription temps réel
- Mise à jour automatique du cache
- Notifications toast pour les changements
- Optimisation des mutations (plus de refetch manuel)

✅ **Avantages:**
- Collaboration temps réel entre utilisateurs
- Synchronisation automatique des données
- Réduction des appels API
- Expérience utilisateur fluide
- Cache Apollo optimisé
