import * as XLSX from 'xlsx';

// ─── Validation ───────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];
const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function validateImportFile(file) {
  if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' };
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Format non supporté. Utilisez CSV, XLS ou XLSX.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Le fichier dépasse la taille maximale de 5 Mo.' };
  }
  return { valid: true, error: null };
}

// ─── CSV Parsing ──────────────────────────────────────────────

function detectSeparator(text) {
  const firstLine = text.split('\n')[0] || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseCSVLine(line, separator) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === separator) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSVRaw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target.result;
        // Strip BOM
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

        const separator = detectSeparator(text);
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');

        if (lines.length < 2) {
          reject(new Error('Le fichier doit contenir au moins un en-tête et une ligne de données.'));
          return;
        }

        const headers = parseCSVLine(lines[0], separator);
        const rows = lines.slice(1).map((line) => parseCSVLine(line, separator));

        resolve({ headers, rows });
      } catch (err) {
        reject(new Error('Erreur lors de la lecture du fichier CSV.'));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsText(file, 'UTF-8');
  });
}

// ─── Excel Parsing ────────────────────────────────────────────

export function parseExcelRaw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (jsonData.length < 2) {
          reject(new Error('Le fichier doit contenir au moins un en-tête et une ligne de données.'));
          return;
        }

        const headers = jsonData[0].map((h) => String(h).trim());
        const rows = jsonData.slice(1).map((row) => row.map((cell) => String(cell ?? '').trim()));

        resolve({ headers, rows });
      } catch (err) {
        reject(new Error('Erreur lors de la lecture du fichier Excel.'));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Client Field Definitions ─────────────────────────────────

export const CLIENT_FIELD_DEFINITIONS = [
  // Général
  { key: 'type', label: 'Type', required: false, group: 'general', aliases: ['type', 'type de client', 'client type', 'catégorie', 'category'] },
  { key: 'name', label: 'Nom / Raison sociale', required: true, group: 'general', aliases: ['nom', 'name', 'raison sociale', 'société', 'company', 'company name', 'entreprise', 'nom entreprise', 'nom de la société', 'nom société'] },
  { key: 'firstName', label: 'Prénom', required: false, group: 'general', aliases: ['prénom', 'prenom', 'first name', 'firstname'] },
  { key: 'lastName', label: 'Nom de famille', required: false, group: 'general', aliases: ['nom de famille', 'last name', 'lastname', 'nom famille'] },
  { key: 'email', label: 'Email', required: false, group: 'general', aliases: ['email', 'e-mail', 'mail', 'courriel', 'adresse email', 'adresse e-mail', 'adresse mail'] },
  { key: 'phone', label: 'Téléphone', required: false, group: 'general', aliases: ['téléphone', 'telephone', 'phone', 'tel', 'tél', 'tél.', 'numéro de téléphone', 'mobile', 'portable'] },

  // Adresse
  { key: 'street', label: 'Adresse', required: false, group: 'address', aliases: ['adresse', 'address', 'rue', 'street', 'voie', 'adresse postale'] },
  { key: 'city', label: 'Ville', required: false, group: 'address', aliases: ['ville', 'city', 'commune'] },
  { key: 'postalCode', label: 'Code postal', required: false, group: 'address', aliases: ['code postal', 'postal code', 'zip', 'zip code', 'cp', 'code'] },
  { key: 'country', label: 'Pays', required: false, group: 'address', aliases: ['pays', 'country'] },

  // Légal
  { key: 'siret', label: 'SIRET', required: false, group: 'legal', aliases: ['siret', 'siren', 'n° siret', 'numéro siret', 'numero siret'] },
  { key: 'vatNumber', label: 'N° TVA', required: false, group: 'legal', aliases: ['tva', 'vat', 'vat number', 'n° tva', 'numéro tva', 'numero tva', 'tva intracommunautaire', 'vat id'] },
  { key: 'isInternational', label: 'International', required: false, group: 'legal', aliases: ['international', 'étranger', 'etranger', 'hors france'] },
];

export const FIELD_GROUPS = [
  { key: 'general', label: 'Général' },
  { key: 'address', label: 'Adresse' },
  { key: 'legal', label: 'Légal' },
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

export function autoDetectMapping(fileHeaders) {
  const mapping = {};
  const usedIndices = new Set();

  for (const field of CLIENT_FIELD_DEFINITIONS) {
    mapping[field.key] = null;
  }

  // First pass: exact matches
  for (const field of CLIENT_FIELD_DEFINITIONS) {
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

  // Second pass: partial matches for unmatched fields
  for (const field of CLIENT_FIELD_DEFINITIONS) {
    if (mapping[field.key] !== null) continue;
    const normalizedAliases = field.aliases.map(normalizeHeader);
    for (let i = 0; i < fileHeaders.length; i++) {
      if (usedIndices.has(i)) continue;
      const normalizedHeader = normalizeHeader(fileHeaders[i]);
      const match = normalizedAliases.some(
        (alias) => normalizedHeader.includes(alias) || alias.includes(normalizedHeader)
      );
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

function parseClientType(value) {
  if (!value) return 'COMPANY';
  const v = value.toLowerCase().trim();
  if (['particulier', 'individual', 'individu', 'personne'].includes(v)) return 'INDIVIDUAL';
  return 'COMPANY';
}

function parseBoolean(value) {
  if (!value) return false;
  const v = value.toLowerCase().trim();
  return ['oui', 'yes', 'true', '1', 'vrai'].includes(v);
}

export function transformRowToClient(row, headers, mapping, customFieldMappings = []) {
  const getValue = (fieldKey) => {
    const idx = mapping[fieldKey];
    if (idx === null || idx === undefined || idx < 0 || idx >= row.length) return '';
    return row[idx]?.trim() || '';
  };

  const client = {
    type: parseClientType(getValue('type')),
    name: getValue('name'),
    firstName: getValue('firstName') || undefined,
    lastName: getValue('lastName') || undefined,
    email: getValue('email') || undefined,
    address: {
      street: getValue('street') || undefined,
      city: getValue('city') || undefined,
      postalCode: getValue('postalCode') || undefined,
      country: getValue('country') || 'France',
    },
    siret: getValue('siret') || undefined,
    vatNumber: getValue('vatNumber') || undefined,
    isInternational: parseBoolean(getValue('isInternational')),
  };

  // Add phone as a contact if present
  const phone = getValue('phone');
  if (phone || client.email) {
    client.contacts = [{
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: phone || '',
      isPrimary: true,
    }];
  }

  // Clean undefined values from address
  Object.keys(client.address).forEach((key) => {
    if (!client.address[key]) delete client.address[key];
  });
  if (!client.address.country) client.address.country = 'France';
  if (Object.keys(client.address).length === 1 && client.address.country === 'France') {
    delete client.address;
  }

  // Clean top-level undefined values
  Object.keys(client).forEach((key) => {
    if (client[key] === undefined) delete client[key];
  });

  // Custom field mappings
  if (customFieldMappings.length > 0) {
    const customFields = [];
    for (const cfm of customFieldMappings) {
      if (cfm.headerIndex === null || cfm.headerIndex === undefined) continue;
      const value = row[cfm.headerIndex]?.trim() || '';
      if (value && cfm.fieldId) {
        customFields.push({ fieldId: cfm.fieldId, value });
      }
    }
    if (customFields.length > 0) {
      client.customFields = customFields;
    }
  }

  return client;
}

// ─── Row Validation ───────────────────────────────────────────

export function validateClientRow(clientData, rowIndex) {
  const errors = [];

  if (!clientData.name || clientData.name.trim() === '') {
    errors.push(`Ligne ${rowIndex + 1} : Le nom / raison sociale est requis.`);
  }

  if (clientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
    errors.push(`Ligne ${rowIndex + 1} : Email invalide "${clientData.email}".`);
  }

  // Backend requires siret for all COMPANY types
  if (clientData.type === 'COMPANY') {
    if (!clientData.siret || clientData.siret.trim() === '') {
      errors.push(
        clientData.isInternational
          ? `Ligne ${rowIndex + 1} : Le numéro d'identification est obligatoire pour une entreprise internationale.`
          : `Ligne ${rowIndex + 1} : Le SIREN/SIRET est obligatoire pour une entreprise.`
      );
    } else if (!clientData.isInternational && !/^(\d{9}|\d{14})$/.test(clientData.siret.replace(/\s/g, ''))) {
      errors.push(`Ligne ${rowIndex + 1} : SIRET invalide "${clientData.siret}" (9 ou 14 chiffres attendus).`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Duplicate Detection ──────────────────────────────────────

export function detectDuplicateEmails(clients) {
  const emailCounts = {};
  const duplicates = [];

  clients.forEach((client, index) => {
    const email = client.email?.toLowerCase();
    if (!email) return;
    if (emailCounts[email] !== undefined) {
      duplicates.push({ rowIndex: index, email, firstOccurrence: emailCounts[email] });
    } else {
      emailCounts[email] = index;
    }
  });

  return duplicates;
}

// ─── Template Generation ──────────────────────────────────────

export function generateTemplate() {
  const headers = [
    'Type',
    'Nom / Raison sociale',
    'Prénom',
    'Nom de famille',
    'Email',
    'Téléphone',
    'Adresse',
    'Ville',
    'Code postal',
    'Pays',
    'SIRET',
    'N° TVA',
    'International',
  ];

  const exampleRow = [
    'Entreprise',
    'Acme Corp',
    'Jean',
    'Dupont',
    'jean@acme.fr',
    '0612345678',
    '12 rue de la Paix',
    'Paris',
    '75001',
    'France',
    '12345678901234',
    'FR12345678901',
    'Non',
  ];

  const csvContent = [
    headers.join(';'),
    exampleRow.join(';'),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-import-contacts.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Error Export ─────────────────────────────────────────────

export function downloadErrorsCSV(errors) {
  const lines = ['Ligne;Erreur', ...errors.map((e) => `"${e.row ?? ''}";"${e.message ?? e}"`)];
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'erreurs-import-contacts.csv';
  link.click();
  URL.revokeObjectURL(url);
}
