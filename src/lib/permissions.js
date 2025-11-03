import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Définition des ressources et actions disponibles dans Newbi
 * @const statement - Utilise "as const" pour l'inférence TypeScript
 */
export const statement = {
  ...defaultStatements, // Permissions par défaut Better Auth (user, session)
  
  // ========================================
  // DOCUMENTS COMMERCIAUX
  // ========================================
  quotes: ["view", "create", "edit", "delete", "approve", "convert", "send", "export"],
  invoices: ["view", "create", "edit", "delete", "approve", "send", "export", "mark-paid"],
  creditNotes: ["view", "create", "edit", "delete", "approve", "send"],
  
  // ========================================
  // FINANCES
  // ========================================
  expenses: ["view", "create", "edit", "delete", "approve", "export", "ocr"],
  payments: ["view", "create", "edit", "delete", "export"],
  
  // ========================================
  // DONNÉES DE BASE
  // ========================================
  clients: ["view", "create", "edit", "delete", "export"],
  products: ["view", "create", "edit", "delete", "export", "manage-categories"],
  suppliers: ["view", "create", "edit", "delete"],
  
  // ========================================
  // OUTILS
  // ========================================
  fileTransfers: ["view", "create", "delete", "download"],
  kanban: ["view", "create", "edit", "delete", "assign"],
  signatures: ["view", "create", "edit", "delete", "set-default"],
  calendar: ["view", "create", "edit", "delete"],
  
  // ========================================
  // RAPPORTS ET ANALYTICS
  // ========================================
  reports: ["view", "export"],
  analytics: ["view", "export"],
  
  // ========================================
  // GESTION ORGANISATION
  // ========================================
  team: ["view", "invite", "remove", "change-role"],
  orgSettings: ["view", "manage"],
  integrations: ["view", "manage"],
  billing: ["view", "manage"],
  auditLog: ["view", "export"],
};

// Créer le contrôleur d'accès
export const ac = createAccessControl(statement);

/**
 * ========================================
 * RÔLE: OWNER
 * ========================================
 * Accès complet à TOUS les modules sans exception
 */
export const owner = ac.newRole({
  ...adminAc.statements, // Permissions admin par défaut Better Auth
  
  // Documents commerciaux - Accès complet
  quotes: ["view", "create", "edit", "delete", "approve", "convert", "send", "export"],
  invoices: ["view", "create", "edit", "delete", "approve", "send", "export", "mark-paid"],
  creditNotes: ["view", "create", "edit", "delete", "approve", "send"],
  
  // Finances - Accès complet
  expenses: ["view", "create", "edit", "delete", "approve", "export", "ocr"],
  payments: ["view", "create", "edit", "delete", "export"],
  
  // Données de base - Accès complet
  clients: ["view", "create", "edit", "delete", "export"],
  products: ["view", "create", "edit", "delete", "export", "manage-categories"],
  suppliers: ["view", "create", "edit", "delete"],
  
  // Outils - Accès complet
  fileTransfers: ["view", "create", "delete", "download"],
  kanban: ["view", "create", "edit", "delete", "assign"],
  signatures: ["view", "create", "edit", "delete", "set-default"],
  calendar: ["view", "create", "edit", "delete"],
  
  // Rapports - Accès complet
  reports: ["view", "export"],
  analytics: ["view", "export"],
  
  // Gestion - Accès complet (y compris facturation)
  team: ["view", "invite", "remove", "change-role"],
  orgSettings: ["view", "manage"],
  integrations: ["view", "manage"],
  billing: ["view", "manage"], // ✅ Owner peut gérer la facturation
  auditLog: ["view", "export"],
});

/**
 * ========================================
 * RÔLE: ADMIN
 * ========================================
 * Accès complet à tous les modules sauf la facturation (réservée au owner)
 */
export const admin = ac.newRole({
  ...adminAc.statements, // Permissions admin par défaut Better Auth (user, session)
  
  // Documents commerciaux - Accès complet
  quotes: ["view", "create", "edit", "delete", "approve", "convert", "send", "export"],
  invoices: ["view", "create", "edit", "delete", "approve", "send", "export", "mark-paid"],
  creditNotes: ["view", "create", "edit", "delete", "approve", "send"],
  
  // Finances - Accès complet
  expenses: ["view", "create", "edit", "delete", "approve", "export", "ocr"],
  payments: ["view", "create", "edit", "delete", "export"],
  
  // Données de base - Accès complet
  clients: ["view", "create", "edit", "delete", "export"],
  products: ["view", "create", "edit", "delete", "export", "manage-categories"],
  suppliers: ["view", "create", "edit", "delete"],
  
  // Outils - Accès complet
  fileTransfers: ["view", "create", "delete", "download"],
  kanban: ["view", "create", "edit", "delete", "assign"],
  signatures: ["view", "create", "edit", "delete", "set-default"],
  calendar: ["view", "create", "edit", "delete"],
  
  // Rapports - Accès complet
  reports: ["view", "export"],
  analytics: ["view", "export"],
  
  // Gestion - Accès complet sauf facturation (manage réservé au owner)
  team: ["view", "invite", "remove", "change-role"],
  orgSettings: ["view", "manage"],
  integrations: ["view", "manage"],
  billing: ["view"], // ⚠️ Lecture seule - "manage" réservé au owner
  auditLog: ["view", "export"],
});

/**
 * ========================================
 * RÔLE: MEMBER (Collaborateur)
 * ========================================
 * Peut créer et gérer ses propres documents
 * Pas de suppression ni validation
 */
export const member = ac.newRole({
  // Documents commerciaux - Création + envoi + export
  quotes: ["view", "create", "send", "export"],
  invoices: ["view", "create", "send", "export"],
  creditNotes: ["view", "create", "export"],
  
  // Finances - Création + export
  expenses: ["view", "create", "ocr", "export"],
  payments: ["view", "create", "export"],
  
  // Données de base - Création + export
  clients: ["view", "create", "export"],
  products: ["view", "create", "export"],
  suppliers: ["view", "create"],
  
  // Outils - Utilisation standard
  fileTransfers: ["view", "create", "download"],
  kanban: ["view", "create", "edit", "assign"],
  signatures: ["view", "create", "edit", "set-default"],
  calendar: ["view", "create", "edit"],
  
  // Rapports - Lecture + export
  reports: ["view", "export"],
  analytics: ["view", "export"],
  
  // Gestion - Lecture seule
  team: ["view"],
  // Pas d'accès: orgSettings, integrations, billing, auditLog
});

/**
 * ========================================
 * RÔLE: VIEWER (Consultation)
 * ========================================
 * Lecture seule sur tous les modules
 * Idéal pour: consultants, auditeurs, comptables externes
 */
export const viewer = ac.newRole({
  // Documents commerciaux - Lecture seule
  quotes: ["view"],
  invoices: ["view"],
  creditNotes: ["view"],
  
  // Finances - Lecture seule
  expenses: ["view"],
  payments: ["view"],
  
  // Données de base - Lecture seule
  clients: ["view"],
  products: ["view"],
  suppliers: ["view"],
  
  // Outils - Lecture + téléchargement uniquement
  fileTransfers: ["view", "download"],
  kanban: ["view"],
  signatures: ["view"],
  calendar: ["view"],
  
  // Rapports - Lecture seule
  reports: ["view"],
  analytics: ["view"],
  
  // Gestion - Lecture seule
  team: ["view"],
  // Pas d'accès: orgSettings, integrations, billing, auditLog
});

/**
 * ========================================
 * RÔLE: ACCOUNTANT (Comptable)
 * ========================================
 * Accès spécifique aux documents financiers + validation + export
 * Rôle gratuit (1 seul par organisation)
 */
export const accountant = ac.newRole({
  // Documents commerciaux - Lecture + export
  quotes: ["view", "export"],
  invoices: ["view", "export", "mark-paid"], // Peut marquer comme payé
  creditNotes: ["view", "export"],
  
  // Finances - Lecture + validation + export
  expenses: ["view", "approve", "export"], // Peut valider les dépenses
  payments: ["view", "export"],
  
  // Données de base - Lecture + export
  clients: ["view", "export"],
  products: ["view", "export"],
  suppliers: ["view"],
  
  // Rapports - Lecture + export
  reports: ["view", "export"],
  analytics: ["view", "export"],
  
  // Gestion - Lecture seule
  team: ["view"],
  auditLog: ["view"], // Peut voir l'audit
  // Pas d'accès aux outils (kanban, transferts, signatures, calendar)
  // Pas d'accès: orgSettings, integrations, billing
});
