import { faker } from "@faker-js/faker/locale/fr";

faker.seed(1);

export function buildSession(overrides = {}) {
  return {
    user: {
      id: faker.string.uuid(),
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      organization: buildOrganization(),
      ...overrides.user,
    },
    ...overrides,
  };
}

export function buildOrganization(overrides = {}) {
  return {
    id: faker.string.uuid(),
    companyName: faker.company.name(),
    companyEmail: faker.internet.email().toLowerCase(),
    addressStreet: "1 rue de Test",
    addressCity: "Paris",
    addressZipCode: "75001",
    addressCountry: "France",
    siret: faker.string.numeric(14),
    legalForm: "SARL",
    ...overrides,
  };
}

export function buildSubscription(overrides = {}) {
  return {
    isActive: () => true,
    subscription: { status: "active", plan: "pme" },
    loading: false,
    trial: { isTrialActive: false, daysRemaining: 0 },
    ...overrides,
  };
}

export function buildClient(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    email: faker.internet.email().toLowerCase(),
    type: "COMPANY",
    siret: faker.string.numeric(14),
    address: {
      street: "1 rue de Test",
      city: "Paris",
      postalCode: "75001",
      country: "France",
    },
    ...overrides,
  };
}

export function buildInvoice(overrides = {}) {
  return {
    id: faker.string.uuid(),
    number: "0001",
    prefix: "F-202604",
    status: "DRAFT",
    issueDate: new Date().toISOString(),
    items: [
      {
        description: faker.commerce.productName(),
        quantity: 1,
        unitPrice: 100,
        vatRate: 20,
      },
    ],
    totalHT: 100,
    totalVAT: 20,
    totalTTC: 120,
    finalTotalHT: 100,
    finalTotalVAT: 20,
    finalTotalTTC: 120,
    ...overrides,
  };
}
