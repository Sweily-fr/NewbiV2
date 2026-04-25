import "@testing-library/jest-dom/vitest";
import React from "react";

// In browser mode we get a real DOM — no polyfills needed, no Next.js mocks required
// (since we test isolated components, not full pages). Keep this lean.
globalThis.React = React;
