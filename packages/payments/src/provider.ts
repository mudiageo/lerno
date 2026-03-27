export interface CreateSubscriptionParams {
  userId: string;
  email: string;
  plan: 'premium_monthly' | 'premium_yearly' | 'institutional';
  currency: 'NGN' | 'USD' | 'GHS' | 'KES' | 'EUR' | 'GBP';
  metadata?: Record<string, string>;
}

export interface WebhookEvent {
  type: 'subscription.created' | 'subscription.renewed' | 'subscription.cancelled' | 'payment.success' | 'payment.failed';
  userId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  raw: any;
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
