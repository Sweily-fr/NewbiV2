import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw/server.js";

// MSW lifecycle: start once, reset per-test, close at the end.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// ─── localStorage polyfill ─────────────────────────────────────────────────
// happy-dom v20.x cassait l'isolation Window/Storage entre tests : après
// `cleanup()` de @testing-library/react, `localStorage` n'était plus
// (re)provisionné, ce qui plantait tous les tests qui appellent
// `localStorage.clear/getItem/setItem` (track-event, clear-apollo-cache,
// auth-client, loginForm). Avant l'upgrade, happy-dom v19 fournissait
// localStorage de manière persistante via le Window global. Pour rester
// indépendant des évolutions du provider, on installe ici un Storage
// mock en mémoire avant chaque test, isolé par test (Map vidée à
// l'init du beforeEach).
beforeEach(() => {
  const installMockStorage = (target) => {
    const store = new Map();
    // API methods exposées via la target du Proxy. Le Proxy gère :
    //   - get(prop)   : retourne la méthode si prop ∈ API, sinon la valeur stockée
    //   - set(prop,v) : `localStorage.foo = "v"` ↔ `setItem("foo", "v")` (compat web)
    //   - has(prop)   : `"foo" in localStorage` ↔ store.has("foo") || prop ∈ API
    //   - ownKeys()   : `Object.keys(localStorage)` ne retourne QUE les clés stockées
    //                   — c'est ce que `clearSessionStorage()` consomme.
    const apiTarget = {
      getItem: (key) =>
        store.has(String(key)) ? store.get(String(key)) : null,
      setItem: (key, value) => {
        store.set(String(key), String(value));
      },
      removeItem: (key) => {
        store.delete(String(key));
      },
      clear: () => {
        store.clear();
      },
      key: (index) => {
        const keys = Array.from(store.keys());
        return keys[index] ?? null;
      },
    };
    const storage = new Proxy(apiTarget, {
      get(t, prop) {
        if (prop === "length") return store.size;
        if (prop in t) return t[prop];
        return store.has(prop) ? store.get(prop) : undefined;
      },
      set(t, prop, value) {
        if (prop in t) {
          t[prop] = value;
          return true;
        }
        store.set(String(prop), String(value));
        return true;
      },
      has(t, prop) {
        return store.has(prop) || prop in t;
      },
      deleteProperty(t, prop) {
        if (prop in t) return false;
        store.delete(String(prop));
        return true;
      },
      ownKeys() {
        return Array.from(store.keys());
      },
      getOwnPropertyDescriptor(t, prop) {
        if (store.has(prop)) {
          return {
            configurable: true,
            enumerable: true,
            value: store.get(prop),
            writable: true,
          };
        }
        return undefined;
      },
    });
    Object.defineProperty(target, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(target, "sessionStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });
  };

  if (typeof window !== "undefined") {
    installMockStorage(window);
  }
  if (typeof globalThis !== "undefined") {
    installMockStorage(globalThis);
  }
});

// ─── Polyfills required by Radix UI / various libs under happy-dom ──────────

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.setPointerCapture = () => {};
}

// ─── Mock Next.js navigation primitives ─────────────────────────────────────

vi.mock("next/navigation", () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
  return {
    useRouter: () => router,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }) =>
    React.createElement("img", {
      src: typeof src === "string" ? src : src?.src,
      alt,
      ...rest,
    }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) =>
    React.createElement(
      "a",
      { href: typeof href === "string" ? href : href?.pathname || "", ...rest },
      children,
    ),
}));
