#!/usr/bin/env node

/**
 * Migration script to move company data from user collection to organization collection
 * This script migrates existing company data stored in user documents to organization documents
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-app';

async function migrateCompanyData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('user');
    const organizationsCollection = db.collection('organization');
    const membersCollection = db.collection('member');
    
    // Find all users with company data
    const usersWithCompany = await usersCollection.find({
      $or: [
        { 'company.name': { $exists: true, $ne: '' } },
        { 'company.email': { $exists: true, $ne: '' } },
        { 'company.siret': { $exists: true, $ne: '' } },
        { 'company.vatNumber': { $exists: true, $ne: '' } },
        { 'company.rcs': { $exists: true, $ne: '' } }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithCompany.length} users with company data to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of usersWithCompany) {
      try {
        // Check if user already has an organization
        const existingMembership = await membersCollection.findOne({ userId: user.id });
        
        if (existingMembership) {
          // Update existing organization with company data
          const organizationId = existingMembership.organizationId;
          
          const companyData = {
            companyName: user.company?.name || '',
            companyEmail: user.company?.email || '',
            companyPhone: user.company?.phone || '',
            website: user.company?.website || '',
            logo: user.company?.logo || '',
            siret: user.company?.siret || '',
            vatNumber: user.company?.vatNumber || '',
            rcs: user.company?.rcs || '',
            legalForm: user.company?.legalForm || '',
            capitalSocial: user.company?.capitalSocial || '',
            fiscalRegime: user.company?.fiscalRegime || '',
            activityCategory: user.company?.activityCategory || '',
            isVatSubject: user.company?.isVatSubject || false,
            hasCommercialActivity: user.company?.hasCommercialActivity || false,
            address: {
              street: user.company?.address?.street || '',
              city: user.company?.address?.city || '',
              zipCode: user.company?.address?.zipCode || '',
              country: user.company?.address?.country || '',
            },
            bankDetails: {
              bankName: user.company?.bankDetails?.bankName || '',
              iban: user.company?.bankDetails?.iban || '',
              bic: user.company?.bankDetails?.bic || '',
            },
          };
          
          await organizationsCollection.updateOne(
            { id: organizationId },
            { $set: companyData }
          );
          
          console.log(`✓ Updated organization ${organizationId} with company data for user ${user.email}`);
        } else {
          // Create new organization for user
          const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const organizationName = user.company?.name || `Organisation de ${user.name || user.email}`;
          const organizationSlug = `org-${user.id.slice(-8)}`;
          
          const organizationData = {
            id: organizationId,
            name: organizationName,
            slug: organizationSlug,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Company data
            companyName: user.company?.name || '',
            companyEmail: user.company?.email || '',
            companyPhone: user.company?.phone || '',
            website: user.company?.website || '',
            logo: user.company?.logo || '',
            siret: user.company?.siret || '',
            vatNumber: user.company?.vatNumber || '',
            rcs: user.company?.rcs || '',
            legalForm: user.company?.legalForm || '',
            capitalSocial: user.company?.capitalSocial || '',
            fiscalRegime: user.company?.fiscalRegime || '',
            activityCategory: user.company?.activityCategory || '',
            isVatSubject: user.company?.isVatSubject || false,
            hasCommercialActivity: user.company?.hasCommercialActivity || false,
            address: {
              street: user.company?.address?.street || '',
              city: user.company?.address?.city || '',
              zipCode: user.company?.address?.zipCode || '',
              country: user.company?.address?.country || '',
            },
            bankDetails: {
              bankName: user.company?.bankDetails?.bankName || '',
              iban: user.company?.bankDetails?.iban || '',
              bic: user.company?.bankDetails?.bic || '',
            },
            metadata: {
              migratedFrom: 'user',
              migratedAt: new Date().toISOString(),
            },
          };
          
          // Create organization
          await organizationsCollection.insertOne(organizationData);
          
          // Create membership
          const memberData = {
            id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            organizationId: organizationId,
            role: 'owner',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await membersCollection.insertOne(memberData);
          
          console.log(`✓ Created organization ${organizationId} and membership for user ${user.email}`);
        }
        
        // Remove company data from user document
        await usersCollection.updateOne(
          { id: user.id },
          { $unset: { company: 1 } }
        );
        
        migratedCount++;
        
      } catch (error) {
        console.error(`✗ Error migrating user ${user.email}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Successfully migrated: ${migratedCount} users`);
    console.log(`Skipped due to errors: ${skippedCount} users`);
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCompanyData().catch(console.error);
}

export { migrateCompanyData };
