import { PostHog } from "posthog-node";

let posthogClient = null;
let shutdownHandlersRegistered = false;

function registerShutdownHandlers() {
  if (shutdownHandlersRegistered || typeof process === "undefined") return;
  shutdownHandlersRegistered = true;

  const flushAndExit = async () => {
    if (!posthogClient) return;
    try {
      await posthogClient.shutdown();
    } catch (e) {
      console.error("[posthog-server] shutdown error:", e);
    }
  };

  process.on("SIGTERM", flushAndExit);
  process.on("SIGINT", flushAndExit);
  process.on("beforeExit", flushAndExit);
}

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    registerShutdownHandlers();
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
