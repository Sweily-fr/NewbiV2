<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Newbi Next.js 15 frontend. PostHog is initialized client-side via `instrumentation-client.js` (the recommended approach for Next.js 15.3+), with a reverse proxy configured in `next.config.js` to route tracking calls through `/ingest` and avoid ad blockers. A server-side PostHog client (`src/lib/posthog-server.js`) is available for API routes. Users are identified on login and signup using `posthog.identify()` with their user ID and email, ensuring client and server events are correlated. Thirteen events are now tracked across authentication, document creation, payments, and engagement flows.

| Event                    | Description                                             | File                                                                      |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `user_signed_up`         | User successfully completes registration                | `app/auth/signup/registerForm.jsx`                                        |
| `user_logged_in`         | User successfully logs in                               | `app/auth/login/loginForm.jsx`                                            |
| `invoice_created`        | Invoice saved for the first time (draft)                | `app/dashboard/outils/factures/hooks/use-invoice-editor.js`               |
| `invoice_sent`           | Invoice finalized and sent to client                    | `app/dashboard/outils/factures/hooks/use-invoice-editor.js`               |
| `quote_created`          | Quote draft created for the first time                  | `app/dashboard/outils/devis/hooks/use-quote-editor.js`                    |
| `quote_sent`             | Quote finalized and sent to client                      | `app/dashboard/outils/devis/hooks/use-quote-editor.js`                    |
| `client_created`         | New client added                                        | `src/hooks/useClients.js`                                                 |
| `file_transfer_created`  | File transfer successfully created                      | `app/dashboard/outils/transferts-fichiers/components/file-upload-new.jsx` |
| `payment_initiated`      | Stripe payment session started for a paid file transfer | `src/hooks/useStripePayment.js`                                           |
| `stripe_connect_started` | User begins Stripe Connect onboarding                   | `src/hooks/useStripeConnect.js`                                           |
| `expense_created`        | New expense recorded (manual or via OCR)                | `src/hooks/useExpense.js`                                                 |
| `esignature_requested`   | Electronic signature request sent                       | `src/hooks/useESignature.js`                                              |
| `tutorial_completed`     | User completes the onboarding tutorial (server-side)    | `app/api/tutorial/complete/route.js`                                      |

## Next steps

We've built a dashboard and five insights for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/192620/dashboard/720987)
- [New signups over time](https://eu.posthog.com/project/192620/insights/FtS12aft) — daily registrations trend
- [Invoice to sent conversion funnel](https://eu.posthog.com/project/192620/insights/IF83XsTK) — what % of created invoices get sent
- [Key document events](https://eu.posthog.com/project/192620/insights/NC5wb113) — invoices, quotes, and clients side by side
- [Signup to first invoice funnel](https://eu.posthog.com/project/192620/insights/5ZaHhWNN) — full onboarding conversion funnel
- [Payment & file transfer activity](https://eu.posthog.com/project/192620/insights/WEn3r9yG) — revenue-adjacent actions over time

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
