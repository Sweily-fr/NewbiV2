const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeSiret = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, "") : "";

export function matchImportedInvoiceToClient(importedInvoice, client) {
  if (!importedInvoice || !client) return false;

  if (importedInvoice.clientId && client.id) {
    return String(importedInvoice.clientId) === String(client.id);
  }

  const impSiret = normalizeSiret(importedInvoice.client?.siret);
  const cliSiret = normalizeSiret(client.siret);
  if (impSiret && cliSiret) return impSiret === cliSiret;

  const impName = normalize(importedInvoice.client?.name);
  const cliName = normalize(client.name);
  if (impName && cliName && impName === cliName) return true;

  if (client.type === "INDIVIDUAL") {
    const fullName = normalize(
      [client.firstName, client.lastName].filter(Boolean).join(" "),
    );
    if (fullName && impName && fullName === impName) return true;
  }

  return false;
}

export function filterImportedInvoicesForClient(importedInvoices, client) {
  if (!Array.isArray(importedInvoices) || !client) return [];
  return importedInvoices.filter((inv) =>
    matchImportedInvoiceToClient(inv, client),
  );
}
