# Scripts

## Scripts qui écrivent dans la base de production

Règle pour tout nouveau script de ce type (exemple :
`normalize-legal-forms.mjs`) :

1. **Aperçu par défaut** : sans option, le script lit, affiche ce qu'il
   ferait et n'écrit rien. `--apply` pour écrire.
2. **Sauvegarde avant écriture** avec `scripts/lib/script-backup.mjs` : une
   entrée `{ collection, _id, before, after }` par document, avec seulement
   les champs modifiés, déjà lus par le script (aucune requête de plus, aucun
   effet sur la plateforme). `writeBackup()` est appelé AVANT la première
   écriture : s'il échoue, rien n'est modifié.
3. **Retour arrière** : `--restore <fichier>` (aperçu, puis `--apply`) remet
   les valeurs d'avant, sauf sur un document modifié depuis dans l'appli.
4. Les fichiers vont dans `~/newbi-backups/<script>/` (ou `SCRIPT_BACKUP_DIR`),
   hors du dépôt, lisibles par leur seul propriétaire : ils peuvent contenir
   des données clients et ne doivent jamais être commités.

Lancement sur la prod depuis un poste local (adresse de la base lue sur le
serveur, jamais copiée à la main) :

```bash
MONGODB_URI="$(ssh -i ~/.ssh/vps_key joaquim@51.91.254.74 'grep -m1 "^MONGODB_URI=" ~/api.newbi.fr/.env.production' | cut -d= -f2- | tr -d "\"' \r")" \
MONGODB_DB_NAME=newbi node scripts/<script>.mjs
```

Côté API, les scripts de remise en état suivent la même règle avec
`scripts/lib/remise-en-etat.js` de newbi-api.
