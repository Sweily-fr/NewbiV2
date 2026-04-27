import { describe, it } from "vitest";

describe("requireActiveSubscription", () => {
  it.skip("returns subscription details when status is 'active'", () => {});

  it.skip("returns subscription details when status is 'trialing'", () => {});

  it.skip("returns subscription details when status is 'canceled' but periodEnd is in the future", () => {});

  it.skip("throws 402 when no subscription exists for the organization", () => {});

  it.skip("throws 402 when subscription status is 'canceled' and periodEnd is in the past", () => {});

  it.skip("throws 402 when subscription status is 'past_due'", () => {});

  it.skip("throws 402 when subscription status is 'incomplete'", () => {});
});
