/**
 * companion/billing.ts — BillingProvider interface + LemonSqueezy & Stripe stub implementations.
 *
 * Stubs return mock data when no API key is configured.
 * Comments mark where real API calls would go.
 */

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
  verifyWebhook(payload: string, signature: string): Promise<WebhookEvent>;
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

  async verifyWebhook(payload: string, _signature: string): Promise<WebhookEvent> {
    // Real implementation: verify HMAC-SHA256 of payload against _signature using webhook secret
    // const secret = process.env["LEMONSQUEEZY_WEBHOOK_SECRET"];
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
  private readonly apiKey: string | undefined;

  constructor(opts?: { apiKey?: string }) {
    this.apiKey = opts?.apiKey ?? process.env["STRIPE_SECRET_KEY"];
  }

  private get isMock(): boolean {
    return !this.apiKey;
  }

  private async stripeRequest(path: string, method: string, body?: URLSearchParams): Promise<unknown> {
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: body?.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe API error ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async createCustomer(email: string, tier: string): Promise<{ customerId: string }> {
    if (this.isMock) {
      return { customerId: mockCustomerId() };
    }

    // Real implementation: POST /v1/customers
    try {
      const params = new URLSearchParams({ email, "metadata[tier]": tier });
      const json = await this.stripeRequest("/customers", "POST", params) as { id: string };
      return { customerId: json.id };
    } catch (err) {
      throw new Error(`Failed to create Stripe customer: ${toErrorMessage(err)}`);
    }
  }

  async createCheckoutSession(customerId: string, priceId: string, returnUrl: string): Promise<{ url: string }> {
    if (this.isMock) {
      return { url: `https://checkout.stripe.com/mock?customer=${customerId}&price=${priceId}&return=${encodeURIComponent(returnUrl)}` };
    }

    // Real implementation: POST /v1/checkout/sessions
    try {
      const params = new URLSearchParams({
        customer: customerId,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        mode: "subscription",
        success_url: returnUrl,
        cancel_url: returnUrl,
      });
      const json = await this.stripeRequest("/checkout/sessions", "POST", params) as { url: string };
      return { url: json.url };
    } catch (err) {
      throw new Error(`Failed to create Stripe checkout: ${toErrorMessage(err)}`);
    }
  }

  async getPortalUrl(customerId: string): Promise<{ url: string }> {
    if (this.isMock) {
      return { url: `https://billing.stripe.com/mock/portal?customer=${customerId}` };
    }

    // Real implementation: POST /v1/billing_portal/sessions
    try {
      const params = new URLSearchParams({ customer: customerId });
      const json = await this.stripeRequest("/billing_portal/sessions", "POST", params) as { url: string };
      return { url: json.url };
    } catch (err) {
      throw new Error(`Failed to create Stripe portal session: ${toErrorMessage(err)}`);
    }
  }

  async listInvoices(customerId: string, limit?: number): Promise<{ invoices: Invoice[] }> {
    if (this.isMock) {
      const count = Math.min(limit ?? 10, 10);
      return { invoices: Array.from({ length: count }, (_, i) => mockInvoice(i)) };
    }

    // Real implementation: GET /v1/invoices?customer={customerId}&limit={limit}
    try {
      const pageSize = Math.min(limit ?? 10, 100);
      const json = await this.stripeRequest(
        `/invoices?customer=${customerId}&limit=${pageSize}`,
        "GET",
      ) as { data: Array<{ id: string; amount_due: number; currency: string; status: string; created: number; invoice_pdf?: string }> };
      const invoices: Invoice[] = json.data.map(inv => ({
        id: inv.id,
        amount: inv.amount_due,
        currency: inv.currency,
        status: inv.status ?? "unknown",
        date: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf,
      }));
      return { invoices };
    } catch (err) {
      throw new Error(`Failed to list Stripe invoices: ${toErrorMessage(err)}`);
    }
  }

  async verifyWebhook(payload: string, _signature: string): Promise<WebhookEvent> {
    // Real implementation: verify Stripe-Signature header using webhook endpoint secret
    // const secret = process.env["STRIPE_WEBHOOK_SECRET"];
    // Use Stripe's signature verification: t=timestamp,v1=signature
    // Compute HMAC-SHA256 of `${timestamp}.${payload}` with secret and compare
    const data = JSON.parse(payload) as { type: string; data: { object: { customer?: string } & Record<string, unknown> } };
    return {
      type: data.type,
      customerId: data.data.object.customer ?? "unknown",
      data: data.data.object,
    };
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
