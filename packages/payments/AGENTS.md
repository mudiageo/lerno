# 💸 Payments Package (@lerno/payments)

This package manages all financial transactions for Lerno, including [Stripe](https://stripe.com/) and [Paystack](https://paystack.com/) integrations.

## 🚀 Usage

Use the `createPaymentProvider` factory to instantiate the appropriate provider based on the user's currency.

```typescript
import { createPaymentProvider } from '@lerno/payments';

const provider = createPaymentProvider('NGN'); // Selects Paystack
const { url } = await provider.createCheckoutSession({
    lineItems: [ ... ],
    successUrl: '...',
    cancelUrl: '...'
});
```

### Provider Selection
- **Paystack**: Automatically selected for African currencies (`NGN`, `GHS`, `KES`, `ZAR`).
- **Stripe**: Default fallback for international currencies.

## 🏗️ Core Interfaces

Defined in [src/provider.ts](./src/provider.ts):
- `createCheckoutSession`: Generates a hosted payment page URL.
- `handleWebhook`: Validates and parses incoming events from payment gateways.
- `refund`: Processes full or partial refunds.

## 🛠️ Development Rules for Agents

- **Provider-Agnostic**: Code against the `PaymentProvider` interface. Never reference `StripeProvider` or `PaystackProvider` directly.
- **Security**: Always use the `handleWebhook` method to verify and process incoming events asynchronously via `@lerno/jobs`.
- **Secrets**: Ensure `STRIPE_SECRET_KEY` and `PAYSTACK_SECRET_KEY` are configured in `.env`.
- **Safety**: Never log full payment objects or transaction IDs in plain text to standard logs.
