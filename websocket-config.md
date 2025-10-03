# Configuration WebSocket pour le Frontend

Pour que les subscriptions GraphQL fonctionnent, vous devez ajouter cette variable d'environnement au frontend.

## Créer le fichier .env.local

Dans le dossier `NewbiV2`, créez un fichier `.env.local` avec le contenu suivant :

```env
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
```

## Ou modifier le fichier .env existant

Si vous avez déjà un fichier `.env`, ajoutez simplement cette ligne :

```env
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
```

## Redémarrer le serveur frontend

Après avoir ajouté la variable d'environnement, redémarrez le serveur frontend :

```bash
cd NewbiV2
npm run dev
```

## Test

Une fois les deux serveurs démarrés (backend et frontend), l'erreur "Socket closed" devrait disparaître et les subscriptions WebSocket devraient fonctionner.
