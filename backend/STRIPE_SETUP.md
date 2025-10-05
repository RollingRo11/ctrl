# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for infrastructure monitoring and analytics subscriptions.

## Features

✅ **Subscription Tiers**
- **Basic Monitoring** ($29/month) - Real-time GPU monitoring with 7-day retention
- **Pro Analytics** ($99/month) - Advanced analytics with 90-day retention and API access
- **Enterprise** ($299/month) - Full suite with AI optimization and unlimited retention

✅ **Stripe Checkout Integration** - Secure hosted payment pages
✅ **Customer Portal** - Let customers manage their subscriptions
✅ **Usage-Based Billing** - Track API calls and storage usage
✅ **Webhook Handling** - Automatic subscription status updates
✅ **Upgrade/Downgrade** - Seamless tier changes with prorated billing

## Setup Instructions

### 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free account
3. Complete your business profile

### 2. Get Your API Keys

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key token" and copy your **Secret key** (starts with `sk_test_`)
4. Update your `.env` file:

\`\`\`env
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
\`\`\`

### 3. Set Up Webhook Endpoint (Optional but Recommended)

Webhooks allow Stripe to notify your server about events (payments, subscription changes, etc.)

1. Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/payments/webhook`
   - For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com/)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Update your `.env` file:

\`\`\`env
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
\`\`\`

### 4. Test Locally with Stripe CLI (Optional)

For local development, you can forward webhooks using the Stripe CLI:

\`\`\`bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3001/api/payments/webhook
\`\`\`

The CLI will output a webhook signing secret - use this for local testing.

### 5. Test the Integration

Use Stripe's test card numbers:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment declined**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any ZIP code.

## API Endpoints

### Get Subscription Tiers
\`\`\`bash
GET /api/payments/subscription-tiers
\`\`\`

### Create Checkout Session
\`\`\`bash
POST /api/payments/create-checkout-session
Content-Type: application/json

{
  "tier": "pro",
  "customerId": "cus_xxxxx" // optional
}
\`\`\`

### Get Subscription Details
\`\`\`bash
GET /api/payments/subscription/:subscriptionId
\`\`\`

### Upgrade/Downgrade Subscription
\`\`\`bash
POST /api/payments/upgrade-subscription
Content-Type: application/json

{
  "subscriptionId": "sub_xxxxx",
  "newTier": "enterprise"
}
\`\`\`

### Cancel Subscription
\`\`\`bash
POST /api/payments/cancel-subscription
Content-Type: application/json

{
  "subscriptionId": "sub_xxxxx",
  "immediately": false  // true = cancel now, false = cancel at period end
}
\`\`\`

### Create Customer Portal Session
\`\`\`bash
POST /api/payments/create-customer-portal
Content-Type: application/json

{
  "customerId": "cus_xxxxx",
  "returnUrl": "https://your-app.com/monitoring"
}
\`\`\`

### Create Usage Record (for usage-based billing)
\`\`\`bash
POST /api/payments/create-usage-record
Content-Type: application/json

{
  "subscriptionItemId": "si_xxxxx",
  "quantity": 1000,  // e.g., 1000 API calls
  "timestamp": 1234567890  // optional, defaults to now
}
\`\`\`

## Frontend Integration

The monitoring subscription page is available at:
\`\`\`
http://localhost:8081 -> Click "Monitoring" tab
\`\`\`

Features:
- 📊 Beautiful pricing cards with feature comparison
- 💳 One-click checkout with Stripe
- 🔄 Upgrade/downgrade subscriptions
- ⚙️ Customer portal for managing billing
- 📱 Fully responsive design

## Going to Production

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Get your live API keys from [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Update production environment variables:

\`\`\`env
STRIPE_SECRET_KEY=sk_live_your_actual_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key_here
\`\`\`

### 2. Set Up Live Webhook

1. Create a new webhook endpoint in live mode
2. Use your production URL
3. Update webhook secret in production

### 3. Enable Customer Portal

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Customize branding (logo, colors, etc.)
3. Configure allowed subscription changes

### 4. Set Up Payment Methods

Enable the payment methods you want to accept:
1. Go to [Payment Methods Settings](https://dashboard.stripe.com/settings/payment_methods)
2. Enable cards, wallets (Apple Pay, Google Pay), bank transfers, etc.

## Customization

### Adding New Subscription Tiers

Edit \`backend/routes/payments.js\`:

\`\`\`javascript
const SUBSCRIPTION_TIERS = {
  // ... existing tiers ...
  premium: {
    name: 'Premium',
    price: 199,
    features: [
      'Custom features here'
    ]
  }
};
\`\`\`

### Custom Pricing

To create custom pricing (annual billing, usage-based, etc.), create prices in the [Stripe Dashboard](https://dashboard.stripe.com/prices) and reference them in your code.

## Troubleshooting

### "Invalid API Key"
- Double-check your API keys in `.env`
- Make sure you're using test keys for development (start with `sk_test_` and `pk_test_`)

### "No such customer"
- Make sure the customer ID exists in your Stripe account
- Check if you're mixing test and live mode

### "Webhook signature verification failed"
- Verify your webhook secret is correct
- Make sure you're using the raw request body (not parsed JSON)
- For local testing, use Stripe CLI to forward webhooks

### Checkout redirects not working
- Verify FRONTEND_URL in `.env` matches your actual frontend URL
- Check that success/cancel URLs are properly configured

## Security Best Practices

✅ **Never expose your secret key** - Keep it server-side only
✅ **Verify webhook signatures** - Always verify events came from Stripe
✅ **Use HTTPS in production** - Stripe requires HTTPS for live mode
✅ **Implement rate limiting** - Prevent abuse of your API endpoints
✅ **Store customer data securely** - Follow PCI compliance guidelines

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)

## Support

If you encounter issues:
1. Check the [Stripe Dashboard](https://dashboard.stripe.com) for errors
2. Review webhook event logs
3. Enable Stripe API logs in your dashboard
4. Contact Stripe support if needed

---

**Happy integrating! 🚀**
