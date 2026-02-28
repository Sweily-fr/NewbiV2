// Re-export generic parsing & validation utilities from client-import
export { validateImportFile, parseCSVRaw, parseExcelRaw } from './client-import';

// ─── Product Field Definitions ───────────────────────────────

export const PRODUCT_FIELD_DEFINITIONS = [
  // General
  {
    key: 'name',
    label: 'Nom',
    required: true,
    group: 'general',
    aliases: ['nom', 'name', 'produit', 'product', 'désignation', 'designation', 'libellé', 'libelle', 'intitulé', 'intitule', 'article'],
  },
  {
    key: 'reference',
    label: 'Référence',
    required: false,
    group: 'general',
    aliases: ['référence', 'reference', 'ref', 'réf', 'réf.', 'ref.', 'code', 'sku', 'code produit', 'code article'],
  },
  {
    key: 'category',
    label: 'Catégorie',
    required: false,
    group: 'general',
    aliases: ['catégorie', 'categorie', 'category', 'type', 'famille', 'groupe', 'group'],
  },
  {
    key: 'description',
    label: 'Description',
    required: false,
    group: 'general',
    aliases: ['description', 'descriptif', 'détail', 'detail', 'détails', 'details', 'commentaire', 'notes'],
  },
  // Pricing
  {
    key: 'unitPrice',
    label: 'Prix unitaire HT',
    required: true,
    group: 'pricing',
    aliases: ['prix unitaire ht', 'prix unitaire ht (€)', 'prix unitaire', 'prix ht', 'prix', 'unit price', 'price', 'tarif', 'montant ht', 'pu ht', 'pu', 'prix ht (€)'],
  },
  {
    key: 'vatRate',
    label: 'Taux TVA (%)',
    required: true,
    group: 'pricing',
    aliases: ['taux tva', 'taux tva (%)', 'tva', 'tva (%)', 'vat rate', 'vat', 'taxe', 'taux de tva'],
  },
  {
    key: 'unit',
    label: 'Unité',
    required: true,
    group: 'pricing',
    aliases: ['unité', 'unite', 'unit', 'unité de mesure', 'mesure', 'u.'],
  },
];

export const PRODUCT_FIELD_GROUPS = [
  { key: 'general', label: 'Général' },
  { key: 'pricing', label: 'Tarification' },
];

// ─── Auto-detect Mapping ──────────────────────────────────────

function normalizeHeader(header) {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function autoDetectProductMapping(fileHeaders) {
  const mapping = {};
  const usedIndices = new Set();

  for (const field of PRODUCT_FIELD_DEFINITIONS) {
    mapping[field.key] = null;
  }

  // First pass: exact matches
  for (const field of PRODUCT_FIELD_DEFINITIONS) {
    const normalizedAliases = field.aliases.map(normalizeHeader);
    for (let i = 0; i < fileHeaders.length; i++) {
      if (usedIndices.has(i)) continue;
      const normalizedHeader = normalizeHeader(fileHeaders[i]);
      if (normalizedAliases.includes(normalizedHeader)) {
        mapping[field.key] = i;
        usedIndices.add(i);
        break;
      }
    }
  }

  // Second pass: strict partial matches for unmatched fields
  // Only match when both strings are long enough and similar enough
  // to avoid false positives like "Code barre" → reference (via "code")
  for (const field of PRODUCT_FIELD_DEFINITIONS) {
    if (mapping[field.key] !== null) continue;
    const normalizedAliases = field.aliases.map(normalizeHeader);
    for (let i = 0; i < fileHeaders.length; i++) {
      if (usedIndices.has(i)) continue;
      const normalizedHeader = normalizeHeader(fileHeaders[i]);
      const match = normalizedAliases.some((alias) => {
        // Skip short aliases/headers to avoid false positives
        if (alias.length < 5 || normalizedHeader.length < 4) return false;
        const shorter = Math.min(alias.length, normalizedHeader.length);
        const longer = Math.max(alias.length, normalizedHeader.length);
        // Require significant overlap: shorter must be >= 60% of longer
        if (shorter / longer < 0.6) return false;
        return normalizedHeader.includes(alias) || alias.includes(normalizedHeader);
      });
      if (match) {
        mapping[field.key] = i;
        usedIndices.add(i);
        break;
      }
    }
  }

  return mapping;
}

// ─── Row Transformation ───────────────────────────────────────

export function transformRowToProduct(row, headers, mapping, customFieldMappings = []) {
  const getValue = (fieldKey) => {
    const idx = mapping[fieldKey];
    if (idx === null || idx === undefined || idx < 0 || idx >= row.length) return '';
    return row[idx]?.trim() || '';
  };

  const parseNumber = (value) => {
    if (!value) return NaN;
    return parseFloat(value.replace(',', '.'));
  };

  const name = getValue('name');
  const reference = getValue('reference');
  const category = getValue('category');
  const description = getValue('description');
  const unitPrice = parseNumber(getValue('unitPrice'));
  const vatRate = parseNumber(getValue('vatRate'));
  const unit = getValue('unit') || 'unité';

  const product = { name };

  if (reference) product.reference = reference;
  if (category) product.category = category;
  if (description) product.description = description;
  if (!isNaN(unitPrice)) product.unitPrice = unitPrice;
  if (!isNaN(vatRate)) product.vatRate = vatRate;
  product.unit = unit;

  // Extraire les valeurs des champs personnalisés
  if (customFieldMappings.length > 0) {
    const customFields = [];
    for (const cfm of customFieldMappings) {
      const idx = cfm.headerIndex;
      if (idx !== null && idx !== undefined && idx >= 0 && idx < row.length) {
        const rawValue = row[idx]?.trim() || '';
        if (rawValue) {
          customFields.push({ fieldId: cfm.fieldId, value: rawValue });
        }
      }
    }
    if (customFields.length > 0) {
      product.customFields = customFields;
    }
  }

  return product;
}

// ─── Row Validation ───────────────────────────────────────────

export function validateProductRow(product, rowIndex) {
  const errors = [];

  if (!product.name || product.name.trim().length < 2) {
    errors.push(`Ligne ${rowIndex + 1} : Le nom doit contenir au moins 2 caractères.`);
  }

  if (product.unitPrice === undefined || product.unitPrice === null || isNaN(product.unitPrice) || product.unitPrice < 0) {
    errors.push(`Ligne ${rowIndex + 1} : Le prix unitaire HT doit être un nombre positif ou zéro.`);
  }

  if (product.vatRate === undefined || product.vatRate === null || isNaN(product.vatRate) || product.vatRate < 0 || product.vatRate > 100) {
    errors.push(`Ligne ${rowIndex + 1} : Le taux de TVA doit être entre 0 et 100.`);
  }

  if (!product.unit || product.unit.trim() === '') {
    errors.push(`Ligne ${rowIndex + 1} : L'unité est requise.`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Template Generation ──────────────────────────────────────

export function generateProductTemplate() {
  const headers = [
    'Nom',
    'Référence',
    'Catégorie',
    'Prix unitaire HT (€)',
    'Taux TVA (%)',
    'Unité',
    'Description',
  ];

  const exampleRow = [
    'Développement web',
    'DEV-001',
    'Service',
    '500,00',
    '20',
    'jour',
    'Prestation de développement web',
  ];

  const csvContent = [headers.join(';'), exampleRow.join(';')].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-import-produits.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Error Export ─────────────────────────────────────────────

export function downloadProductErrorsCSV(errors) {
  const lines = ['Ligne;Erreur', ...errors.map((e) => `"${e.row ?? ''}";"${e.message ?? e}"`)];
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'erreurs-import-produits.csv';
  link.click();
  URL.revokeObjectURL(url);
}
