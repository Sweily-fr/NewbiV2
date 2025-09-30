#!/usr/bin/env node

/**
 * Script de test pour vérifier la persistance des paramètres d'affichage des coordonnées bancaires
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'invoice-app';

async function testBankDetailsPersistence() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie');
    
    const db = client.db(MONGODB_DB_NAME);
    const organizationCollection = db.collection('organization');
    
    // Trouver une organisation de test
    const organization = await organizationCollection.findOne({});
    
    if (!organization) {
      console.log('❌ Aucune organisation trouvée pour le test');
      return;
    }
    
    console.log(`📋 Test avec l'organisation: ${organization.companyName || organization.id}`);
    
    // Vérifier les champs de paramètres de document
    const documentFields = [
      'documentTextColor',
      'documentHeaderTextColor', 
      'documentHeaderBgColor',
      'documentHeaderNotes',
      'documentFooterNotes',
      'documentTermsAndConditions',
      'showBankDetails'
    ];
    
    console.log('\n🔍 Vérification des champs de paramètres de document:');
    documentFields.forEach(field => {
      const value = organization[field];
      const status = value !== undefined ? '✅' : '❌';
      console.log(`  ${status} ${field}: ${value !== undefined ? value : 'non défini'}`);
    });
    
    // Test de mise à jour du champ showBankDetails
    console.log('\n🧪 Test de mise à jour showBankDetails...');
    
    const newValue = !organization.showBankDetails;
    const updateResult = await organizationCollection.updateOne(
      { _id: organization._id },
      { $set: { showBankDetails: newValue } }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log(`✅ Mise à jour réussie: showBankDetails = ${newValue}`);
      
      // Vérifier la mise à jour
      const updatedOrg = await organizationCollection.findOne({ _id: organization._id });
      if (updatedOrg.showBankDetails === newValue) {
        console.log('✅ Vérification: la valeur a bien été persistée');
        
        // Remettre la valeur d'origine
        await organizationCollection.updateOne(
          { _id: organization._id },
          { $set: { showBankDetails: organization.showBankDetails } }
        );
        console.log('✅ Valeur d\'origine restaurée');
      } else {
        console.log('❌ Erreur: la valeur n\'a pas été persistée correctement');
      }
    } else {
      console.log('❌ Erreur lors de la mise à jour');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testBankDetailsPersistence().catch(console.error);
