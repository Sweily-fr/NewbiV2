/**
 * Script de migration pour les utilisateurs existants
 * À exécuter AVANT la mise en production des nouvelles fonctionnalités onboarding
 *
 * Exécution :
 * 1. Via MongoDB Shell : mongosh "mongodb://..." --file migration-onboarding-flags.js
 * 2. Ou via MongoDB Compass (copier les requêtes une par une)
 */

// ============================================
// MIGRATION 1 : Marquer les organisations existantes comme onboardingCompleted
// ============================================

// Toutes les organisations qui ont un abonnement actif sont considérées comme ayant complété l'onboarding
db.organization.updateMany(
  {
    onboardingCompleted: { $exists: false }
  },
  {
    $set: {
      onboardingCompleted: true,
      updatedAt: new Date()
    }
  }
);

print("✅ Migration 1 terminée : onboardingCompleted ajouté aux organisations existantes");

// ============================================
// MIGRATION 2 : Marquer les utilisateurs existants comme hasSeenOnboarding
// ============================================

// Tous les utilisateurs qui sont membres d'une organisation sont considérés comme ayant vu l'onboarding
// D'abord, récupérer tous les userIds qui sont membres d'une organisation
const memberUserIds = db.member.distinct("userId");

db.user.updateMany(
  {
    _id: { $in: memberUserIds },
    hasSeenOnboarding: { $exists: false }
  },
  {
    $set: {
      hasSeenOnboarding: true,
      updatedAt: new Date()
    }
  }
);

print("✅ Migration 2 terminée : hasSeenOnboarding ajouté aux utilisateurs membres d'une organisation");

// ============================================
// MIGRATION 3 : Ajouter le champ siren si manquant (extraire du siret)
// ============================================

// Le SIREN = les 9 premiers chiffres du SIRET
db.organization.find({
  siret: { $exists: true, $ne: "" },
  siren: { $exists: false }
}).forEach(function(org) {
  const siren = org.siret.substring(0, 9);
  db.organization.updateOne(
    { _id: org._id },
    {
      $set: {
        siren: siren,
        updatedAt: new Date()
      }
    }
  );
});

print("✅ Migration 3 terminée : siren extrait du siret pour les organisations existantes");

// ============================================
// VÉRIFICATION
// ============================================

print("\n📊 Statistiques après migration :");
print("- Organisations avec onboardingCompleted: " + db.organization.countDocuments({ onboardingCompleted: true }));
print("- Utilisateurs avec hasSeenOnboarding: " + db.user.countDocuments({ hasSeenOnboarding: true }));
print("- Organisations avec siren: " + db.organization.countDocuments({ siren: { $exists: true, $ne: "" } }));
