// Test manuel de synchronisation des sièges
// Usage: node test-sync.js <organizationId>

const organizationId = process.argv[2];

if (!organizationId) {
  console.error('❌ Usage: node test-sync.js <organizationId>');
  process.exit(1);
}

async function testSync() {
  try {
    console.log(`🔄 Test de synchronisation pour ${organizationId}`);
    
    const response = await fetch(`http://localhost:3000/api/billing/sync-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Synchronisation réussie:', result);
    } else {
      console.error('❌ Erreur:', result);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

testSync();
