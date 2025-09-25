#!/usr/bin/env node

/**
 * Script pour réinitialiser l'onboarding d'une organisation
 * Usage: node scripts/reset-onboarding.js [organizationId]
 */

import { MongoClient } from 'mongodb';

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'newbi';

async function resetOnboarding(organizationId = null) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie');
    
    const db = client.db(DB_NAME);
    const organizationsCollection = db.collection('organization');
    
    let filter = {};
    if (organizationId) {
      filter = { id: organizationId };
    }
    
    // Réinitialiser l'onboarding
    const result = await organizationsCollection.updateMany(
      filter,
      {
        $set: {
          hasCompletedOnboarding: false,
          onboardingStep: 0
        }
      }
    );
    
    console.log(`✅ Onboarding réinitialisé pour ${result.modifiedCount} organisation(s)`);
    
    if (organizationId) {
      console.log(`🎯 Organisation ciblée: ${organizationId}`);
    } else {
      console.log('🌍 Toutes les organisations ont été réinitialisées');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Récupérer l'ID d'organisation depuis les arguments
const organizationId = process.argv[2];

if (organizationId) {
  console.log(`🚀 Réinitialisation de l'onboarding pour l'organisation: ${organizationId}`);
} else {
  console.log('🚀 Réinitialisation de l\'onboarding pour TOUTES les organisations');
  console.log('⚠️  Pour cibler une organisation spécifique: node scripts/reset-onboarding.js [organizationId]');
}

resetOnboarding(organizationId);
