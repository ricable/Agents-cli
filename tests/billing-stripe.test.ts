/**
 * Tests for companion/billing.ts — Stripe SDK integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock stripe ──────────────────────────────────────────────────────

const mockStripeInstance = {
  customers: {
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  invoices: {
    list: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock("stripe", () => ({
  default: vi.fn(() => mockStripeInstance),
}));

import { StripeProvider } from "../lib/companion/billing.js";

// ── StripeProvider ────────────────────────────────────────────────────

describe("StripeProvider — mock mode (no API key)", () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    savedKey = process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_SECRET_KEY"];
  });
  afterEach(() => {
    if (savedKey !== undefined) process.env["STRIPE_SECRET_KEY"] = savedKey;
    else delete process.env["STRIPE_SECRET_KEY"];
  });

  it("createCustomer returns mock customerId", async () => {
    const provider = new StripeProvider({ apiKey: undefined });
    const result = await provider.createCustomer("test@example.com", "pro");
    expect(result.customerId).toMatch(/^cus_mock_/);
  });

  it("createCheckoutSession returns mock URL", async () => {
    const provider = new StripeProvider({ apiKey: undefined });
    const result = await provider.createCheckoutSession("cus_mock_1", "price_123", "http://localhost/");
    expect(result.url).toContain("checkout.stripe.com/mock");
  });

  it("getPortalUrl returns mock URL", async () => {
    const provider = new StripeProvider({ apiKey: undefined });
    const result = await provider.getPortalUrl("cus_mock_1");
    expect(result.url).toContain("billing.stripe.com/mock");
  });

  it("listInvoices returns mock invoices", async () => {
    const provider = new StripeProvider({ apiKey: undefined });
    const result = await provider.listInvoices("cus_mock_1", 3);
    expect(result.invoices).toHaveLength(3);
    expect(result.invoices[0]).toMatchObject({ currency: "usd", status: "paid" });
  });

  it("verifyWebhook throws when in mock mode", async () => {
    const provider = new StripeProvider({ apiKey: undefined });
    await expect(provider.verifyWebhook("{}", "sig", "whsec_test")).rejects.toThrow(
      "Cannot verify webhook without Stripe API key",
    );
  });
});

describe("StripeProvider — SDK mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createCustomer calls stripe.customers.create with email + metadata", async () => {
    mockStripeInstance.customers.create.mockResolvedValue({ id: "cus_real_123" });
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    const result = await provider.createCustomer("user@example.com", "pro");
    expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
      email: "user@example.com",
      metadata: { tier: "pro" },
    });
    expect(result.customerId).toBe("cus_real_123");
  });

  it("createCheckoutSession calls stripe.checkout.sessions.create in subscription mode", async () => {
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_abc",
    });
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    const result = await provider.createCheckoutSession(
      "cus_real_123",
      "price_pro_monthly",
      "http://localhost/?checkout=success",
    );
    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
      customer: "cus_real_123",
      line_items: [{ price: "price_pro_monthly", quantity: 1 }],
      mode: "subscription",
      success_url: "http://localhost/?checkout=success",
      cancel_url: "http://localhost/?checkout=success",
      metadata: { priceId: "price_pro_monthly" },
      subscription_data: { metadata: { priceId: "price_pro_monthly" } },
    });
    expect(result.url).toBe("https://checkout.stripe.com/pay/cs_test_abc");
  });

  it("createCheckoutSession throws if Stripe returns no URL", async () => {
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({ url: null });
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    await expect(
      provider.createCheckoutSession("cus_real_123", "price_pro", "http://localhost/"),
    ).rejects.toThrow("Stripe returned no checkout URL");
  });

  it("getPortalUrl calls stripe.billingPortal.sessions.create", async () => {
    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/sess_test",
    });
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    const result = await provider.getPortalUrl("cus_real_123");
    expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_real_123",
    });
    expect(result.url).toBe("https://billing.stripe.com/session/sess_test");
  });

  it("listInvoices calls stripe.invoices.list with correct params", async () => {
    const now = Math.floor(Date.now() / 1000);
    mockStripeInstance.invoices.list.mockResolvedValue({
      data: [
        {
          id: "inv_001",
          amount_due: 2900,
          currency: "usd",
          status: "paid",
          created: now,
          invoice_pdf: "https://invoice.stripe.com/pdf/inv_001",
        },
      ],
    });
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    const result = await provider.listInvoices("cus_real_123", 5);
    expect(mockStripeInstance.invoices.list).toHaveBeenCalledWith({
      customer: "cus_real_123",
      limit: 5,
    });
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0]).toMatchObject({
      id: "inv_001",
      amount: 2900,
      currency: "usd",
      status: "paid",
    });
  });

  it("verifyWebhook calls stripe.webhooks.constructEvent and returns WebhookEvent", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_real_123",
          payment_status: "paid",
        },
      },
    };
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    const result = await provider.verifyWebhook(
      '{"type":"checkout.session.completed"}',
      "t=123,v1=abc",
      "whsec_test_secret",
    );
    expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
      '{"type":"checkout.session.completed"}',
      "t=123,v1=abc",
      "whsec_test_secret",
    );
    expect(result.type).toBe("checkout.session.completed");
    expect(result.customerId).toBe("cus_real_123");
  });

  it("verifyWebhook throws on HMAC mismatch", async () => {
    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    await expect(
      provider.verifyWebhook('{"type":"foo"}', "bad_sig", "whsec_test"),
    ).rejects.toThrow("Webhook verification failed");
  });

  it("verifyWebhook throws when no secret provided", async () => {
    // Ensure no env var
    delete process.env["STRIPE_WEBHOOK_SECRET"];
    const provider = new StripeProvider({ apiKey: "sk_test_abc" });
    await expect(
      provider.verifyWebhook('{"type":"foo"}', "sig_abc"),
    ).rejects.toThrow("No Stripe webhook secret configured");
  });
});
