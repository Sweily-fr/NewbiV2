# Configuration trustedOrigins — Better Auth

## Principe

Les origines de confiance (trustedOrigins) controlent quelles URLs peuvent initier des requetes authentifiees vers Better Auth (OAuth callbacks, session validation, etc.).

Principe 13 : les trustedOrigins sont gerees par environnement, pas hardcodees.

## Origines permanentes (dans le code)

Ces origines sont toujours valables, quel que soit l'environnement :

| Origine                     | Raison                       |
| --------------------------- | ---------------------------- |
| https://newbi.fr            | Production                   |
| https://www.newbi.fr        | Production www               |
| https://newbi-v2.vercel.app | Deploiement Vercel principal |
| http://localhost:3000       | Developpement local          |
| newbi://                    | App mobile Expo              |

## Origines additionnelles (variable d'environnement)

La variable `ADDITIONAL_TRUSTED_ORIGINS` permet d'ajouter des origines supplementaires sans modifier le code.

### Format

Liste d'URLs separees par des virgules (CSV) :

```
ADDITIONAL_TRUSTED_ORIGINS=https://preview1.vercel.app,https://preview2.vercel.app,https://abc123.ngrok-free.app
```

### Configuration par environnement (Vercel)

| Environnement | Valeur recommandee                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Production    | Vide (seules les origines permanentes sont utilisees)                                                                                  |
| Preview       | URLs des preview deployments (ex: `https://newbi-v2-git-develop-xxx.vercel.app,https://newbi-v2-git-security-refactor-xxx.vercel.app`) |
| Development   | URLs ngrok + toute URL de dev supplementaire                                                                                           |

### Configuration dans Vercel Dashboard

1. Vercel Dashboard → Projet NewbiV2 → Settings → Environment Variables
2. Add New :
   - Key : `ADDITIONAL_TRUSTED_ORIGINS`
   - Value : URLs separees par des virgules
   - Environment : cocher Preview et/ou Development (PAS Production sauf besoin specifique)
3. Save
4. Redeploy si necessaire

### Securite

- Ne JAMAIS mettre d'URLs de dev/staging dans les origines permanentes (code)
- En production, `ADDITIONAL_TRUSTED_ORIGINS` devrait etre vide ou absent
- Chaque ajout d'origine est un elargissement de la surface d'attaque OAuth
- Les URLs ngrok sont ephemeres — les retirer quand le tunnel est ferme
