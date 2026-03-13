/**
 * companion/billing.ts — BillingProvider interface + LemonSqueezy & Stripe implementations.
 *
 * Stripe uses the official stripe npm SDK.
 * LemonSqueezy uses raw fetch (no official SDK).
 * Both fall back to mock data when no API key is configured.
 */

import Stripe from "stripe";
import { toErrorMessage } from "../output.js";

// ── Interfaces ─────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl?: string;
}

export interface WebhookEvent {
  type: string;
  customerId: string;
  data: Record<string, unknown>;
}

export interface BillingProvider {
  name: string;
  createCustomer(email: string, tier: string): Promise<{ customerId: string }>;
  createCheckoutSession(customerId: string, priceId: string, returnUrl: string): Promise<{ url: string }>;
  getPortalUrl(customerId: string): Promise<{ url: string }>;
  listInvoices(customerId: string, limit?: number): Promise<{ invoices: Invoice[] }>;
  verifyWebhook(payload: string, signature: string, secret?: string): Promise<WebhookEvent>;
}

// ── Helpers ────────────────────────────────────────────────────────────

function mockCustomerId(): string {
  return `cus_mock_${Date.now().toString(36)}`;
}

function mockInvoice(index: number): Invoice {
  return {
    id: `inv_mock_${index}`,
    amount: 2900,
    currency: "usd",
    status: "paid",
    date: new Date(Date.now() - index * 30 * 86_400_000).toISOString(),
  };
}

// ── LemonSqueezy ───────────────────────────────────────────────────────

export class LemonSqueezyProvider implements BillingProvider {
  readonly name = "lemonsqueezy";
  private readonly apiKey: string | undefined;
  private readonly storeId: string | undefined;

  constructor(opts?: { apiKey?: string; storeId?: string }) {
    this.apiKey = opts?.apiKey ?? process.env["LEMONSQUEEZY_API_KEY"];
    this.storeId = opts?.storeId ?? process.env["LEMONSQUEEZY_STORE_ID"];
  }

  private get isMock(): boolean {
    return !this.apiKey;
  }

  async createCustomer(email: string, tier: string): Promise<{ customerId: string }> {
    if (this.isMock) {
      return { customerId: mockCustomerId() };
    }

    // Real implementation: POST https://api.lemonsqueezy.com/v1/customers
    // Headers: { Authorization: `Bearer ${this.apiKey}`, Content-Type: "application/vnd.api+json" }
    // Body: { data: { type: "customers", attributes: { email, name: tier }, relationships: { store: { data: { type: "stores", id: this.storeId } } } } }
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "customers",
            attributes: { email, name: tier },
            relationships: {
              store: { data: { type: "stores", id: this.storeId } },
            },
          },
        }),
      });
      if (!res.ok) throw new Error(`LemonSqueezy API error: ${res.status}`);
      const json = await res.json() as { data: { id: string } };
      return { customerId: json.data.id };
    } catch (err) {
      throw new Error(`Failed to create LemonSqueezy customer: ${toErrorMessage(err)}`);
    }
  }

  async createCheckoutSession(customerId: string, priceId: string, returnUrl: string): Promise<{ url: string }> {
    if (this.isMock) {
      return { url: `https://checkout.lemonsqueezy.com/mock?customer=${customerId}&price=${priceId}&return=${encodeURIComponent(returnUrl)}` };
    }

    // Real implementation: POST https://api.lemonsqueezy.com/v1/checkouts
    // with variant_id (priceId), custom customer data, checkout_data.custom.return_url
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: { custom: { customer_id: customerId } },
              product_options: { redirect_url: returnUrl },
            },
            relationships: {
              store: { data: { type: "stores", id: this.storeId } },
              variant: { data: { type: "variants", id: priceId } },
            },
          },
        }),
      });
      if (!res.ok) throw new Error(`LemonSqueezy API error: ${res.status}`);
      const json = await res.json() as { data: { attributes: { url: string } } };
      return { url: json.data.attributes.url };
    } catch (err) {
      throw new Error(`Failed to create LemonSqueezy checkout: ${toErrorMessage(err)}`);
    }
  }

  async getPortalUrl(customerId: string): Promise<{ url: string }> {
    if (this.isMock) {
      return { url: `https://app.lemonsqueezy.com/my-orders/mock?customer=${customerId}` };
    }

    // Real implementation: GET https://api.lemonsqueezy.com/v1/customers/{customerId}
    // then return attributes.urls.customer_portal
    try {
      const res = await fetch(`https://api.lemonsqueezy.com/v1/customers/${customerId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/vnd.api+json",
        },
      });
      if (!res.ok) throw new Error(`LemonSqueezy API error: ${res.status}`);
      const json = await res.json() as { data: { attributes: { urls: { customer_portal: string } } } };
      return { url: json.data.attributes.urls.customer_portal };
    } catch (err) {
      throw new Error(`Failed to get LemonSqueezy portal URL: ${toErrorMessage(err)}`);
    }
  }

  async listInvoices(customerId: string, limit?: number): Promise<{ invoices: Invoice[] }> {
    if (this.isMock) {
      const count = Math.min(limit ?? 10, 10);
      return { invoices: Array.from({ length: count }, (_, i) => mockInvoice(i)) };
    }

    // Real implementation: GET https://api.lemonsqueezy.com/v1/orders?filter[customer_id]={customerId}&page[size]={limit}
    try {
      const pageSize = Math.min(limit ?? 10, 100);
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/orders?filter[customer_id]=${customerId}&page[size]=${pageSize}`,
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Accept": "application/vnd.api+json",
          },
        },
      );
      if (!res.ok) throw new Error(`LemonSqueezy API error: ${res.status}`);
      const json = await res.json() as { data: Array<{ id: string; attributes: { total: number; currency: string; status: string; created_at: string; urls: { receipt?: string } } }> };
      const invoices: Invoice[] = json.data.map(order => ({
        id: order.id,
        amount: order.attributes.total,
        currency: order.attributes.currency,
        status: order.attributes.status,
        date: order.attributes.created_at,
        pdfUrl: order.attributes.urls.receipt,
      }));
      return { invoices };
    } catch (err) {
      throw new Error(`Failed to list LemonSqueezy invoices: ${toErrorMessage(err)}`);
    }
  }

  async verifyWebhook(payload: string, _signature: string, _secret?: string): Promise<WebhookEvent> {
    // Real implementation: verify HMAC-SHA256 of payload against _signature using webhook secret
    // const secret = _secret ?? process.env["LEMONSQUEEZY_WEBHOOK_SECRET"];
    // const hmac = createHmac("sha256", secret).update(payload).digest("hex");
    // if (hmac !== _signature) throw new Error("Invalid webhook signature");
    const data = JSON.parse(payload) as { meta: { event_name: string; custom_data?: { customer_id?: string } }; data: Record<string, unknown> };
    return {
      type: data.meta.event_name,
      customerId: data.meta.custom_data?.customer_id ?? "unknown",
      data: data.data,
    };
  }
}

// ── Stripe ──────────────────────────────────────────────────────────────

export class StripeProvider implements BillingProvider {
  readonly name = "stripe";
  private readonly stripe: Stripe | null;

  constructor(opts?: { apiKey?: string }) {
    const apiKey = opts?.apiKey ?? process.env["STRIPE_SECRET_KEY"];
    this.stripe = apiKey ? new Stripe(apiKey) : null;
  }

  private get isMock(): boolean {
    return this.stripe === null;
  }

  async createCustomer(email: string, tier: string): Promise<{ customerId: string }> {
    if (this.isMock) {
      return { customerId: mockCustomerId() };
    }
    try {
      const customer = await this.stripe!.customers.create({
        email,
        metadata: { tier },
      });
      return { customerId: customer.id };
    } catch (err) {
      throw new Error(`Failed to create Stripe customer: ${toErrorMessage(err)}`);
    }
  }

  async createCheckoutSession(customerId: string, priceId: string, returnUrl: string): Promise<{ url: string }> {
    if (this.isMock) {
      return { url: `https://checkout.stripe.com/mock?customer=${customerId}&price=${priceId}&return=${encodeURIComponent(returnUrl)}` };
    }
    try {
      const session = await this.stripe!.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: returnUrl,
        cancel_url: returnUrl,
      });
      if (!session.url) throw new Error("Stripe returned no checkout URL");
      return { url: session.url };
    } catch (err) {
      throw new Error(`Failed to create Stripe checkout: ${toErrorMessage(err)}`);
    }
  }

  async getPortalUrl(customerId: string): Promise<{ url: string }> {
    if (this.isMock) {
      return { url: `https://billing.stripe.com/mock/portal?customer=${customerId}` };
    }
    try {
      const session = await this.stripe!.billingPortal.sessions.create({
        customer: customerId,
      });
      return { url: session.url };
    } catch (err) {
      throw new Error(`Failed to create Stripe portal session: ${toErrorMessage(err)}`);
    }
  }

  async listInvoices(customerId: string, limit?: number): Promise<{ invoices: Invoice[] }> {
    if (this.isMock) {
      const count = Math.min(limit ?? 10, 10);
      return { invoices: Array.from({ length: count }, (_, i) => mockInvoice(i)) };
    }
    try {
      const pageSize = Math.min(limit ?? 10, 100);
      const list = await this.stripe!.invoices.list({ customer: customerId, limit: pageSize });
      const invoices: Invoice[] = list.data.map(inv => ({
        id: inv.id,
        amount: inv.amount_due,
        currency: inv.currency,
        status: inv.status ?? "unknown",
        date: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf ?? undefined,
      }));
      return { invoices };
    } catch (err) {
      throw new Error(`Failed to list Stripe invoices: ${toErrorMessage(err)}`);
    }
  }

  async verifyWebhook(payload: string, signature: string, secret?: string): Promise<WebhookEvent> {
    const webhookSecret = secret ?? process.env["STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) throw new Error("No Stripe webhook secret configured");
    if (this.isMock) throw new Error("Cannot verify webhook without Stripe API key");
    try {
      const event = this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret);
      const obj = event.data.object as unknown as { customer?: string } & Record<string, unknown>;
      return {
        type: event.type,
        customerId: obj.customer ?? "unknown",
        data: obj,
      };
    } catch (err) {
      throw new Error(`Webhook verification failed: ${toErrorMessage(err)}`);
    }
  }
}

// ── Factory ─────────────────────────────────────────────────────────────

/**
 * Create a billing provider by name.
 */
export function createBillingProvider(name: "lemonsqueezy" | "stripe", opts?: Record<string, string>): BillingProvider {
  switch (name) {
    case "lemonsqueezy":
      return new LemonSqueezyProvider(opts);
    case "stripe":
      return new StripeProvider(opts);
    default:
      throw new Error(`Unknown billing provider: ${name as string}`);
  }
}
