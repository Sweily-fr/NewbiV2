import { setupServer } from "msw/node";
import { graphql, http, HttpResponse } from "msw";

const GRAPHQL_URL = "http://localhost:4000/graphql";

/**
 * Default handlers — return empty/null responses so unmocked queries
 * don't crash a component test. Override per-test with `server.use(...)`.
 */
export const defaultHandlers = [
  graphql.query(/.*/, () => HttpResponse.json({ data: {} })),
  graphql.mutation(/.*/, () => HttpResponse.json({ data: {} })),
  http.all(GRAPHQL_URL, () => HttpResponse.json({ data: {} })),
];

export const server = setupServer(...defaultHandlers);
export { graphql, http, HttpResponse };
