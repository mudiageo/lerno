# Payments — Paystack + Stripe Integration

## Strategy

- **Paystack** — Africa-first (Nigeria, Ghana, Kenya, South Africa). Default for NGN/GHS/KES.
- **Stripe** — Global fallback (USD, EUR, GBP, and more). Default outside Africa.
- Gateway is **auto-selected by user's country** (from IP or registration country).
- Both support: subscriptions, one-time payments, webhooks.

---

## Subscription Tiers

| Plan | Monthly | Yearly | Currency | Features |
|---|---|---|---|---|
| Free | — | — | — | Basic feed, 50 AI posts/day, 3 courses |
| Premium Student | ₦3,000 / $3 | ₦25,000 / $25 | NGN/USD | Unlimited AI, offline downloads, AI tutor, mock exams, all courses |
| Institutional | Custom | Custom | Any | Per-seat, lecturer dashboard, analytics |
| One-time: Mock Exam | ₦500 / $0.50 | — | NGN/USD | Single AI mock exam paper per course |

---

## Payment Provider Abstraction

```typescript
// packages/payments/src/provider.ts
export interface CreateSubscriptionParams {
  userId: string;
  email: string;
  plan: 'premium_monthly' | 'premium_yearly' | 'institutional';
  currency: 'NGN' | 'USD' | 'GHS' | 'KES' | 'EUR' | 'GBP';
  metadata?: Record<string, string>;
}

export interface PaymentProvider {
  createSubscription(params: CreateSubscriptionParams): Promise<{
    checkoutUrl: string;
    subscriptionId: string;
  }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  createOneTimePayment(params: {
    userId: string;
    email: string;
    amount: number;  // in smallest unit
    currency: string;
    description: string;
  }): Promise<{ checkoutUrl: string; reference: string }>;
  verifyWebhook(payload: string, signature: string): boolean;
  parseWebhookEvent(payload: string): WebhookEvent;
}

export interface WebhookEvent {
  type: 'subscription.created' | 'subscription.renewed' | 'subscription.cancelled' | 'payment.success' | 'payment.failed';
  userId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  raw: any;
}
```

### Paystack Implementation

```typescript
// packages/payments/src/paystack.ts
import { Paystack } from 'paystack-sdk';
import crypto from 'crypto';

const PLANS = {
  premium_monthly_NGN: 'PLN_xxx',  // Create in Paystack dashboard
  premium_yearly_NGN: 'PLN_yyy',
};

const PRICES = {
  premium_monthly: { NGN: 300000, GHS: 2500, KES: 400 },  // in kobo/pesewas/cents
  premium_yearly:  { NGN: 2500000, GHS: 20000, KES: 3200 },
};

export class PaystackProvider implements PaymentProvider {
  private client: Paystack;
  private secretKey: string;

  constructor(secretKey: string) {
    this.client = new Paystack(secretKey);
    this.secretKey = secretKey;
  }

  async createSubscription({ userId, email, plan, currency, metadata }) {
    const planCode = PLANS[`${plan}_${currency}`];
    const response = await this.client.transaction.initialize({
      email,
      plan: planCode,
      currency,
      callback_url: `${process.env.PUBLIC_APP_URL}/settings/billing?success=true`,
      metadata: { userId, plan, ...metadata },
    });
    return {
      checkoutUrl: response.data.authorization_url,
      subscriptionId: response.data.reference,
    };
  }

  async cancelSubscription(subscriptionCode: string) {
    await this.client.subscription.disable({ code: subscriptionCode, token: '' });
  }

  async createOneTimePayment({ userId, email, amount, currency, description }) {
    const response = await this.client.transaction.initialize({
      email, amount, currency,
      callback_url: `${process.env.PUBLIC_APP_URL}/study/mock-exam?success=true`,
      metadata: { userId, description },
    });
    return {
      checkoutUrl: response.data.authorization_url,
      reference: response.data.reference,
    };
  }

  verifyWebhook(payload: string, signature: string) {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    const event = JSON.parse(payload);
    const map: Record<string, WebhookEvent['type']> = {
      'subscription.create': 'subscription.created',
      'invoice.payment_failed': 'payment.failed',
      'invoice.update': 'subscription.renewed',
      'subscription.not_renew': 'subscription.cancelled',
      'charge.success': 'payment.success',
    };
    return {
      type: map[event.event] ?? 'payment.success',
      userId: event.data?.metadata?.userId,
      subscriptionId: event.data?.subscription_code,
      amount: event.data?.amount,
      currency: event.data?.currency,
      raw: event,
    };
  }
}
```

### Stripe Implementation

```typescript
// packages/payments/src/stripe.ts
import Stripe from 'stripe';

const PRICE_IDS = {
  premium_monthly_USD: 'price_xxx',  // Create in Stripe dashboard
  premium_yearly_USD: 'price_yyy',
};

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  async createSubscription({ userId, email, plan, currency, metadata }) {
    // Get or create Stripe customer
    const existing = await this.stripe.customers.list({ email, limit: 1 });
    let customer = existing.data[0];
    if (!customer) {
      customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[`${plan}_${currency}`], quantity: 1 }],
      success_url: `${process.env.PUBLIC_APP_URL}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_APP_URL}/settings/billing?cancelled=true`,
      subscription_data: { metadata: { userId, plan } },
      allow_promotion_codes: true,
    });

    return { checkoutUrl: session.url!, subscriptionId: session.id };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  }

  async createOneTimePayment({ userId, email, amount, currency, description }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: { currency, unit_amount: amount, product_data: { name: description } },
        quantity: 1,
      }],
      success_url: `${process.env.PUBLIC_APP_URL}/study/mock-exam?success=true`,
      cancel_url: `${process.env.PUBLIC_APP_URL}/study/mock-exam`,
      metadata: { userId },
    });
    return { checkoutUrl: session.url!, reference: session.id };
  }

  verifyWebhook(payload: string, signature: string) {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch { return false; }
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    const event = JSON.parse(payload);
    const map: Record<string, WebhookEvent['type']> = {
      'customer.subscription.created': 'subscription.created',
      'customer.subscription.updated': 'subscription.renewed',
      'customer.subscription.deleted': 'subscription.cancelled',
      'checkout.session.completed': 'payment.success',
      'invoice.payment_failed': 'payment.failed',
    };
    const sub = event.data?.object;
    return {
      type: map[event.type] ?? 'payment.success',
      userId: sub?.metadata?.userId,
      subscriptionId: sub?.id,
      amount: sub?.amount_total ?? sub?.amount,
      currency: sub?.currency?.toUpperCase(),
      raw: event,
    };
  }
}
```

### Factory — Auto-select by currency

```typescript
// packages/payments/src/index.ts
export function createPaymentProvider(currency: string): PaymentProvider {
  const africaCurrencies = ['NGN', 'GHS', 'KES', 'ZAR'];
  
  if (africaCurrencies.includes(currency)) {
    return new PaystackProvider(process.env.PAYSTACK_SECRET_KEY!);
  }
  
  return new StripeProvider(
    process.env.STRIPE_SECRET_KEY!,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
```

---

## Webhook Handlers

```typescript
// apps/web/src/routes/api/webhooks/paystack/+server.ts
import { json } from '@sveltejs/kit';
import { createPaymentProvider } from '$payments';
import { db } from '$db/client';
import { subscriptions, users, paymentEvents } from '$db/schema';

export async function POST({ request }) {
  const payload = await request.text();
  const sig = request.headers.get('x-paystack-signature') ?? '';
  
  const provider = new PaystackProvider(process.env.PAYSTACK_SECRET_KEY!);
  if (!provider.verifyWebhook(payload, sig)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = provider.parseWebhookEvent(payload);
  await handlePaymentEvent(event);
  return json({ received: true });
}

async function handlePaymentEvent(event: WebhookEvent) {
  // Log raw event always
  await db.insert(paymentEvents).values({
    userId: event.userId,
    provider: 'paystack',
    eventType: event.type,
    amount: event.amount,
    currency: event.currency,
    status: event.type.includes('fail') ? 'failed' : 'active',
    rawPayload: event.raw,
  });

  if (event.type === 'subscription.created' || event.type === 'subscription.renewed') {
    if (!event.userId) return;
    
    // Upsert subscription record
    await db.insert(subscriptions).values({
      userId: event.userId,
      provider: 'paystack',
      providerSubId: event.subscriptionId!,
      plan: 'premium_monthly',
      status: 'active',
      billingPeriod: 'monthly',
      amount: event.amount!,
      currency: event.currency!,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    }).onConflictDoUpdate({
      target: subscriptions.providerSubId,
      set: { status: 'active', currentPeriodEnd: new Date(Date.now() + 30 * 86400000) },
    });
    
    // Upgrade user plan
    await db.update(users)
      .set({ plan: 'premium' })
      .where(eq(users.id, event.userId));
  }
  
  if (event.type === 'subscription.cancelled') {
    await db.update(subscriptions)
      .set({ status: 'cancelled', cancelAtEnd: true })
      .where(eq(subscriptions.providerSubId, event.subscriptionId!));
    
    // Downgrade after period ends (handled by a pg-boss job)
    await pgBoss.sendAfter('downgrade-user', { userId: event.userId }, {}, new Date(/* currentPeriodEnd */));
  }
}
```

---

## Offline Download DRM

Downloaded content is protected using a signed URL + device binding approach:

```typescript
// apps/web/src/lib/server/remote/downloads.ts
import { command, query } from '$app/server';
import crypto from 'crypto';

// Premium users can download own-platform videos (NOT YouTube)
export const requestDownload = command(async ({ userId, postId, deviceId }) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.plan === 'free') throw new Error('Premium required');
  
  const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  if (!post || !['video', 'short'].includes(post.postType)) throw new Error('Not downloadable');
  if (post.content?.youtubeId) throw new Error('YouTube content cannot be downloaded');
  
  // Create time-limited signed download token (24h)
  const token = crypto
    .createHmac('sha256', process.env.DOWNLOAD_SECRET!)
    .update(`${userId}:${postId}:${deviceId}:${Math.floor(Date.now() / 86400000)}`)
    .digest('hex');
  
  // Get signed R2 URL valid for 24 hours
  const signedUrl = await storage.getSignedUrl(post.content.videoKey, 86400);
  
  return { downloadUrl: signedUrl, token, expiresAt: Date.now() + 86400000 };
});
```

In Tauri (native), downloads are stored in app data directory with the token embedded. On app open, tokens are verified — expired tokens prevent playback.
