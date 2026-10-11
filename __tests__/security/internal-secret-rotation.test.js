// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Rotation du secret interne partagé avec l'API (x-internal-secret).
 *
 * La réception accepte INTERNAL_API_SECRET OU INTERNAL_API_SECRET_ALT
 * (facultative, ignorée si vide) ; l'envoi utilise toujours
 * INTERNAL_API_SECRET. Avant, seule la clé principale était acceptée :
 * changer le secret coupait les appels entre l'API et le site le temps que
 * les deux côtés soient à jour.
 */

const m = vi.hoisted(() => ({ resendSend: vi.fn() }));
// Dépendances du barrel @/src/lib/security, inutiles ici
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: async () => null } },
}));
vi.mock("@/src/lib/mongodb", () => ({ mongoDb: { collection: () => ({}) } }));
vi.mock("@/src/lib/resend", () => ({
  resend: { emails: { send: (...args) => m.resendSend(...args) } },
}));
vi.mock("@/src/lib/email-templates", () => ({
  emailTemplates: { guideLeadNotification: () => "<p>lead</p>" },
}));

import {
  requireInternalSecret,
  hasInternalSecret,
} from "@/src/lib/security/require-internal-secret";

const OLD = "ancienne-cle-interne-0123456789";
const NEW = "nouvelle-cle-interne-9876543210";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const setReceiverEnv = ({ main, alt }) => {
  vi.stubEnv("INTERNAL_API_SECRET", main ?? "");
  vi.stubEnv("INTERNAL_API_SECRET_ALT", alt ?? "");
};

const makeRequest = (secret) =>
  new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret === undefined ? {} : { "x-internal-secret": secret }),
    },
    body: JSON.stringify({
      lead: { firstName: "A", lastName: "B" },
      recipients: ["x@y.fr"],
    }),
  });

const requireStatus = (secret) => {
  try {
    requireInternalSecret(makeRequest(secret));
    return 200;
  } catch (response) {
    return response.status;
  }
};

// Route réelle protégée par requireInternalSecret (appelée par l'API)
const callLeadsNotify = async (secret) => {
  const { POST } = await import("@/app/api/leads/notify/route");
  return (await POST(makeRequest(secret))).status;
};

describe("hasInternalSecret / requireInternalSecret : clé principale et clé ALT", () => {
  it("accepte la clé principale", async () => {
    setReceiverEnv({ main: OLD, alt: NEW });
    expect(hasInternalSecret(makeRequest(OLD))).toBe(true);
    expect(requireStatus(OLD)).toBe(200);
    expect(await callLeadsNotify(OLD)).toBe(200);
  });

  it("accepte la clé ALT", async () => {
    setReceiverEnv({ main: OLD, alt: NEW });
    expect(hasInternalSecret(makeRequest(NEW))).toBe(true);
    expect(requireStatus(NEW)).toBe(200);
    expect(await callLeadsNotify(NEW)).toBe(200);
  });

  it("refuse toute autre valeur, y compris un préfixe ou l'absence d'en-tête", async () => {
    setReceiverEnv({ main: OLD, alt: NEW });
    for (const value of ["autre-valeur", OLD.slice(0, -1), `${NEW}x`, ""]) {
      expect(hasInternalSecret(makeRequest(value))).toBe(false);
      expect(requireStatus(value)).toBe(401);
    }
    expect(hasInternalSecret(makeRequest(undefined))).toBe(false);
    expect(requireStatus(undefined)).toBe(401);
    expect(await callLeadsNotify("autre-valeur")).toBe(401);
    expect(m.resendSend).not.toHaveBeenCalled();
  });

  it("ignore une clé ALT vide ou faite d'espaces", () => {
    for (const alt of ["", "   "]) {
      setReceiverEnv({ main: OLD, alt });
      expect(hasInternalSecret(makeRequest(alt))).toBe(false);
      expect(requireStatus(alt)).toBe(401);
      expect(hasInternalSecret(makeRequest(NEW))).toBe(false);
      expect(hasInternalSecret(makeRequest(OLD))).toBe(true);
    }
  });

  it("sans aucun secret configuré : 500 et aucun accès", () => {
    setReceiverEnv({ main: "", alt: "" });
    expect(hasInternalSecret(makeRequest(""))).toBe(false);
    expect(requireStatus("")).toBe(500);
  });
});

describe("procédure de rotation entre un émetteur et un récepteur", () => {
  // État des variables d'un côté (site ou API) à chaque étape
  const STATES = [
    { label: "départ (ancienne seule)", main: OLD, alt: "" },
    { label: "état 1 (ALT nouvelle)", main: OLD, alt: NEW },
    { label: "état 2 (nouvelle, ALT ancienne)", main: NEW, alt: OLD },
    { label: "état 3 (nouvelle seule)", main: NEW, alt: "" },
  ];

  // Ce que tout émetteur envoie : toujours INTERNAL_API_SECRET
  const sentBy = (state) => state.main;

  // Pendant l'étape k, chaque côté (et chaque instance Vercel ou PM2) est
  // soit encore à l'état k-1, soit déjà à l'état k, dans n'importe quel ordre.
  const PAIRS = [];
  for (let step = 1; step < STATES.length; step += 1) {
    for (const sender of [STATES[step - 1], STATES[step]]) {
      for (const receiver of [STATES[step - 1], STATES[step]]) {
        PAIRS.push([
          `étape ${step} : émetteur ${sender.label} vers récepteur ${receiver.label}`,
          sender,
          receiver,
        ]);
      }
    }
  }

  it.each(PAIRS)("%s : accepté", async (_name, sender, receiver) => {
    setReceiverEnv(receiver);
    const sent = sentBy(sender);
    expect(hasInternalSecret(makeRequest(sent))).toBe(true);
    expect(requireStatus(sent)).toBe(200);
    expect(await callLeadsNotify(sent)).toBe(200);
  });

  it("enchaîner deux étapes sans attendre l'autre côté provoque des refus", () => {
    // Un côté encore au départ, l'autre déjà à l'étape 2 : la nouvelle clé
    // envoyée n'est pas connue du premier. Chaque étape doit être terminée
    // des deux côtés avant de passer à la suivante.
    const [start, , step2] = STATES;
    setReceiverEnv(start);
    expect(hasInternalSecret(makeRequest(sentBy(step2)))).toBe(false);
  });
});
