// Runs before every spec file.
import "./commands";

// Next.js dev mode throws hydration / overlay errors that bubble up as
// uncaught exceptions — they don't actually break the app, so swallow them.
Cypress.on("uncaught:exception", (err) => {
  const benign = [
    /ResizeObserver loop/,
    /Hydration/,
    /hydration/,
    /Minified React error/,
    /NEXT_REDIRECT/,
    /ChunkLoadError/,
    /Loading CSS chunk/,
  ];
  if (benign.some((re) => re.test(err.message))) {
    return false; // prevent Cypress from failing the test
  }
});
