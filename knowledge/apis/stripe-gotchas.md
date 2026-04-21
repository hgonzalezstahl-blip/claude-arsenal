# Stripe Integration Gotchas

**Context:** Rekaliber PMS payment processing

## Webhook Signature Verification

- MUST verify webhook signatures in production — never skip
- Use the raw request body (not parsed JSON) for signature verification
- NestJS: use a raw body parser middleware on the webhook route only
- The webhook signing secret is different from the API key

## Idempotency

- Always send `Idempotency-Key` header on payment creation
- Use the reservation ID or a deterministic hash as the key
- Stripe deduplicates within 24 hours — after that, same key creates a new charge

## Connected Accounts (for property owners)

- Use Stripe Connect with destination charges
- Platform collects full amount, then transfers to connected account minus fees
- Each property owner needs their own connected account
- Onboarding flow uses Stripe's hosted Account Links

## Currency Handling

- Stripe amounts are in cents (e.g., $100.00 = 10000)
- Always convert at the API boundary, not in business logic
- Store prices in cents in the database to avoid floating point issues

## Test Mode

- Use `sk_test_` keys in development, `sk_live_` in production
- Test card numbers: 4242424242424242 (success), 4000000000000002 (decline)
- Webhook testing: use Stripe CLI `stripe listen --forward-to localhost:3000/webhooks`
