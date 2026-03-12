/**
 * Test data fixtures for E2E tests.
 * Contains sample objects that match the application's data models.
 */

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'luffy32291@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'Test1234',
  name: 'Test User',
};

export const TEST_SIGNUP_USER = {
  email: `test-signup-${Date.now()}@example.com`,
  password: 'NewUser123!',
  name: 'New Test User',
  companyName: 'Test Company SARL',
};

export const TEST_CLIENT = {
  name: 'Client Test E2E',
  email: 'client-e2e@example.com',
  phone: '+33612345678',
  company: 'Client Company SAS',
  address: {
    street: '10 rue de la Paix',
    city: 'Paris',
    zipCode: '75002',
    country: 'France',
  },
  siret: '98765432109876',
};

export const TEST_INVOICE = {
  clientName: 'Client Test E2E',
  items: [
    {
      description: 'Prestation de conseil',
      quantity: 2,
      unitPrice: 500,
      vatRate: 20,
    },
    {
      description: 'Développement web',
      quantity: 5,
      unitPrice: 800,
      vatRate: 20,
    },
  ],
  notes: 'Facture de test E2E - ne pas traiter',
  paymentTerms: 30,
};

export const TEST_QUOTE = {
  clientName: 'Client Test E2E',
  items: [
    {
      description: 'Audit technique',
      quantity: 1,
      unitPrice: 1500,
      vatRate: 20,
    },
    {
      description: 'Rapport de recommandation',
      quantity: 1,
      unitPrice: 750,
      vatRate: 20,
    },
  ],
  validityDays: 30,
  notes: 'Devis de test E2E',
};

export const TEST_SUPPLIER_INVOICE = {
  fileName: 'facture-fournisseur-test.pdf',
  expectedFields: {
    supplier: 'Fournisseur Test',
    amount: '1200.00',
    date: '2025-01-15',
  },
};

/**
 * Calculate expected totals for an invoice/quote items array.
 */
export function calculateExpectedTotals(items) {
  let totalHT = 0;
  let totalTVA = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    const lineTVA = lineTotal * (item.vatRate / 100);
    totalHT += lineTotal;
    totalTVA += lineTVA;
  }

  return {
    totalHT: totalHT.toFixed(2),
    totalTVA: totalTVA.toFixed(2),
    totalTTC: (totalHT + totalTVA).toFixed(2),
  };
}
