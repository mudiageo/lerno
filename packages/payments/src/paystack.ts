import { Paystack } from 'paystack-sdk';
import crypto from 'crypto';
import { type PaymentProvider, type WebhookEvent } from './provider';

const PLANS: Record<string, string> = {
  premium_monthly_NGN: 'PLN_xxx',  // Create in Paystack dashboard
  premium_yearly_NGN: 'PLN_yyy',
};

export class PaystackProvider implements PaymentProvider {
  private client: Paystack;
  private secretKey: string;

  constructor(secretKey: string) {
    this.client = new Paystack(secretKey);
    this.secretKey = secretKey;
  }

  async createSubscription({ userId, email, plan, currency, metadata }: any) {
    const planCode = PLANS[`${plan}_${currency}`];
    const response = await this.client.transaction.initialize({
      email,
      plan: planCode,
      currency,
      callback_url: `${process.env.PUBLIC_APP_URL}/settings/billing?success=true`,
      metadata: { userId, plan, ...metadata } as any,
    });
    return {
      checkoutUrl: response.data?.authorization_url || '',
      subscriptionId: response.data?.reference || '',
    };
  }

  async cancelSubscription(subscriptionCode: string) {
    await this.client.subscription.disable({ code: subscriptionCode, token: '' });
  }

  async createOneTimePayment({ userId, email, amount, currency, description }: any) {
    const response = await this.client.transaction.initialize({
      email, amount: String(amount), currency,
      callback_url: `${process.env.PUBLIC_APP_URL}/study/mock-exam?success=true`,
      metadata: { userId, description } as any,
    });
    return {
      checkoutUrl: response.data?.authorization_url || '',
      reference: response.data?.reference || '',
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
