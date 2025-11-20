# 📋 URLs à indexer sur Google Search Console

**Domaine** : https://newbi.fr  
**Date** : 17 novembre 2025

---

## 🎯 Comment indexer ces URLs

### Méthode 1 : Google Search Console (Recommandé)

1. **Aller sur** : https://search.google.com/search-console
2. **Sélectionner** la propriété `newbi.fr`
3. **Pour chaque URL ci-dessous** :
   - Cliquer sur "Inspection de l'URL" (en haut)
   - Coller l'URL complète
   - Cliquer sur "Demander une indexation"
   - Attendre 1-2 minutes entre chaque demande

### Méthode 2 : Soumettre le sitemap (Plus rapide)

1. **Aller sur** : https://search.google.com/search-console
2. **Menu** : Sitemaps
3. **Ajouter** : `https://newbi.fr/sitemap.xml`
4. **Cliquer** sur "Envoyer"

⚠️ **Important** : Utilise toujours `https://` (jamais `http://`)

---

## 📄 URLs à indexer (Copier-Coller)

### 🏠 Page principale (Priorité HAUTE)

```
https://newbi.fr
```

### 📦 Pages produits (Priorité HAUTE)

```
https://newbi.fr/produits/devis
https://newbi.fr/produits/factures
https://newbi.fr/produits/signatures
https://newbi.fr/produits/transfers
https://newbi.fr/produits/kanban
```

### ❓ Page FAQ (Priorité MOYENNE)

```
https://newbi.fr/faq
```

### 📜 Pages légales (Priorité BASSE)

```
https://newbi.fr/mentions-legales
https://newbi.fr/politique-de-confidentialite
https://newbi.fr/cgv
```

---

## 📊 Récapitulatif

| Type de page       | Nombre      | URLs                                                                                                       |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------------------------- |
| **Page d'accueil** | 1           | `https://newbi.fr`                                                                                         |
| **Pages produits** | 5           | `/produits/devis`, `/produits/factures`, `/produits/signatures`, `/produits/transfers`, `/produits/kanban` |
| **FAQ**            | 1           | `/faq`                                                                                                     |
| **Pages légales**  | 3           | `/mentions-legales`, `/politique-de-confidentialite`, `/cgv`                                               |
| **TOTAL**          | **10 URLs** |                                                                                                            |

---

## 🚫 Pages à NE PAS indexer (Déjà protégées)

Ces pages sont automatiquement exclues via `robots.txt` et meta `noindex` :

- ❌ `/dashboard/*` (toutes les pages du dashboard)
- ❌ `/auth/*` (login, signup, etc.)
- ❌ `/api/*` (API routes)
- ❌ `/accept-invitation/*`
- ❌ `/transfer/*`
- ❌ `/reactivate-account`

---

## 📝 Script d'indexation rapide

Pour indexer toutes les pages en une fois, copie-colle ce texte dans Google Search Console :

### Liste complète (10 URLs)

```
https://newbi.fr
https://newbi.fr/produits/devis
https://newbi.fr/produits/factures
https://newbi.fr/produits/signatures
https://newbi.fr/produits/transfers
https://newbi.fr/produits/kanban
https://newbi.fr/faq
https://newbi.fr/mentions-legales
https://newbi.fr/politique-de-confidentialite
https://newbi.fr/cgv
https://newbi.fr/blog/devis-professionnels-guide-complet
```

### Priorité HAUTE uniquement (6 URLs)

```
https://newbi.fr
https://newbi.fr/produits/devis
https://newbi.fr/produits/factures
https://newbi.fr/produits/signatures
https://newbi.fr/produits/transfers
https://newbi.fr/produits/kanban
```

---

## 🔍 Vérification après indexation

### 1. Vérifier que les URLs sont indexées

Après 24-48h, tape dans Google :

```
site:newbi.fr
```

Tu devrais voir environ **10 résultats**.

### 2. Vérifier une page spécifique

```
site:newbi.fr/produits/devis
```

### 3. Vérifier le logo

Cherche "newbi" sur Google → Le logo Newbi doit apparaître (pas Vercel)

---

## 🛠️ Outils de vérification

### Google Search Console

- **URL** : https://search.google.com/search-console
- **Vérifier** : Couverture → Pages indexées
- **Objectif** : 10 pages indexées

### Google Rich Results Test

- **URL** : https://search.google.com/test/rich-results
- **Tester** : `https://newbi.fr`
- **Vérifier** : Données structurées (Organization, JSON-LD)

### Facebook Debugger (Force le cache Google)

- **URL** : https://developers.facebook.com/tools/debug/
- **Tester** : `https://newbi.fr`
- **Cliquer** : "Scrape Again"
- **Vérifier** : Image = Logo Newbi

### Open Graph Checker

- **URL** : https://www.opengraph.xyz/
- **Tester** : `https://newbi.fr`
- **Vérifier** :
  - Title = "Newbi - Solution de gestion complète..."
  - Image = Logo Newbi
  - Description présente

---

## ⏱️ Délais d'indexation

| Action                        | Délai      |
| ----------------------------- | ---------- |
| **Demande d'indexation**      | 24-48h     |
| **Indexation naturelle**      | 1-7 jours  |
| **Mise à jour du logo**       | 2-7 jours  |
| **Apparition dans recherche** | 3-14 jours |

---

## 📈 Suivi de l'indexation

### Semaine 1

- [ ] Soumettre le sitemap
- [ ] Demander l'indexation des 6 URLs prioritaires
- [ ] Vérifier robots.txt : `https://newbi.fr/robots.txt`
- [ ] Vérifier sitemap : `https://newbi.fr/sitemap.xml`

### Semaine 2

- [ ] Vérifier les pages indexées dans Search Console
- [ ] Demander l'indexation des pages légales
- [ ] Tester le logo sur Google

### Semaine 3

- [ ] Analyser les performances dans Search Console
- [ ] Vérifier les erreurs d'indexation
- [ ] Optimiser si nécessaire

---

## 🎯 Objectifs SEO

| Métrique             | Objectif   | Délai      |
| -------------------- | ---------- | ---------- |
| **Pages indexées**   | 10/10      | 1 semaine  |
| **Logo correct**     | ✅ Newbi   | 2 semaines |
| **Impressions**      | > 100/mois | 1 mois     |
| **Clics**            | > 10/mois  | 1 mois     |
| **Position moyenne** | < 20       | 3 mois     |

---

## 🆘 En cas de problème

### Le logo Vercel apparaît toujours

1. Vérifier que `/opengraph-image.png` contient le logo Newbi
2. Forcer le cache avec Facebook Debugger
3. Attendre 7 jours (cache Google)

### Les pages ne s'indexent pas

1. Vérifier `robots.txt` : pas de `Disallow: /` global
2. Vérifier les meta tags : pas de `noindex` sur pages publiques
3. Vérifier Search Console : erreurs d'exploration

### Erreurs 404 dans le sitemap

1. Vérifier que toutes les URLs du sitemap existent
2. Tester chaque URL manuellement
3. Corriger le sitemap si nécessaire

---

## 📞 Support

Si tu rencontres des problèmes :

1. Consulter `SEO_AUDIT_COMPLET.md`
2. Vérifier `SEO_FINAL_CHECKLIST.md`
3. Exécuter `./scripts/check-seo.sh`

---

**Dernière mise à jour** : 17 novembre 2025  
**Prochaine action** : Indexer les 10 URLs sur Google Search Console
