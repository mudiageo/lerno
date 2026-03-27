import { StripeProvider } from './stripe';
import { PaystackProvider } from './paystack';
import { type PaymentProvider } from './provider';

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

export * from './provider';
export * from './stripe';
export * from './paystack';
