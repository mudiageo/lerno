import Stripe from 'stripe';
import { type PaymentProvider, type WebhookEvent } from './provider';

const PRICE_IDS: Record<string, string> = {
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

  async createSubscription({ userId, email, plan, currency, metadata }: any) {
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
      subscription_data: { metadata: { userId, plan, ...metadata } },
      allow_promotion_codes: true,
    });

    return { checkoutUrl: session.url!, subscriptionId: session.id };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  }

  async createOneTimePayment({ userId, email, amount, currency, description }: any) {
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
    const sub = event.data?.object as any;
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
