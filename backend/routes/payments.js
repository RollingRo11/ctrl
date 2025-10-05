const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription tiers for infrastructure monitoring
const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic Monitoring',
    price: 29,
    priceId: process.env.STRIPE_PRICE_BASIC,
    features: [
      'Real-time GPU utilization',
      'Basic performance metrics',
      'Email alerts',
      '7-day data retention',
      'Standard support'
    ]
  },
  pro: {
    name: 'Pro Analytics',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO,
    features: [
      'Everything in Basic',
      'Advanced predictive analytics',
      'Custom dashboards',
      '90-day data retention',
      'SMS + Email alerts',
      'Priority support',
      'API access'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    features: [
      'Everything in Pro',
      'AI-powered optimization',
      'Unlimited data retention',
      'White-label reports',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
};

// GET /api/payments/subscription-tiers
// Get available subscription tiers
router.get('/subscription-tiers', (req, res) => {
  res.json({
    success: true,
    tiers: SUBSCRIPTION_TIERS
  });
});

// POST /api/payments/create-checkout-session
// Create a Stripe Checkout session for subscription
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { tier, customerId, successUrl, cancelUrl } = req.body;

    if (!SUBSCRIPTION_TIERS[tier]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier'
      });
    }

    const tierInfo = SUBSCRIPTION_TIERS[tier];

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierInfo.name,
              description: `GPU Infrastructure Monitoring - ${tierInfo.name}`,
              metadata: {
                tier: tier,
                features: tierInfo.features.join(', ')
              }
            },
            unit_amount: tierInfo.price * 100,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        tier: tier,
        type: 'monitoring_subscription'
      },
      success_url: successUrl || `${process.env.FRONTEND_URL}/monitoring?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/monitoring?canceled=true`,
      allow_promotion_codes: true
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/payments/create-usage-record
// Create usage-based billing record (for API calls, storage, etc.)
router.post('/create-usage-record', async (req, res) => {
  try {
    const { subscriptionItemId, quantity, timestamp } = req.body;

    if (!subscriptionItemId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Subscription item ID and quantity are required'
      });
    }

    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity: quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment'
      }
    );

    res.json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp
      }
    });
  } catch (error) {
    console.error('Error creating usage record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/payments/upgrade-subscription
// Upgrade/downgrade subscription tier
router.post('/upgrade-subscription', async (req, res) => {
  try {
    const { subscriptionId, newTier } = req.body;

    if (!subscriptionId || !newTier) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID and new tier are required'
      });
    }

    if (!SUBSCRIPTION_TIERS[newTier]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier'
      });
    }

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Create new price for the tier
    const tierInfo = SUBSCRIPTION_TIERS[newTier];
    const newPrice = await stripe.prices.create({
      unit_amount: tierInfo.price * 100,
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: {
        name: tierInfo.name,
        metadata: { tier: newTier }
      }
    });

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPrice.id
      }],
      proration_behavior: 'always_invoice',
      metadata: {
        tier: newTier
      }
    });

    res.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        tier: newTier,
        amount: tierInfo.price,
        status: updatedSubscription.status
      }
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/payments/cancel-subscription
// Cancel monitoring subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, immediately } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required'
      });
    }

    let subscription;
    if (immediately) {
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/payments/subscription/:subscriptionId
// Get subscription details
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(req.params.subscriptionId);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.metadata.tier,
        amount: subscription.items.data[0].price.unit_amount / 100,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        created: subscription.created
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/payments/customer/:customerId
// Get customer with subscriptions
router.get('/customer/:customerId', async (req, res) => {
  try {
    const customer = await stripe.customers.retrieve(req.params.customerId, {
      expand: ['subscriptions']
    });

    res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        subscriptions: customer.subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          tier: sub.metadata.tier,
          amount: sub.items.data[0].price.unit_amount / 100,
          currentPeriodEnd: sub.current_period_end
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/payments/create-customer-portal
// Create customer portal session for managing subscriptions
router.post('/create-customer-portal', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/monitoring`
    });

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating customer portal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/payments/webhook
// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`✅ Checkout completed: ${session.id}`);
      console.log(`   Tier: ${session.metadata.tier}`);
      // TODO: Grant access to monitoring features
      break;

    case 'customer.subscription.created':
      const newSub = event.data.object;
      console.log(`🔔 New subscription: ${newSub.id}`);
      console.log(`   Tier: ${newSub.metadata.tier}`);
      console.log(`   Amount: $${newSub.items.data[0].price.unit_amount / 100}/month`);
      break;

    case 'customer.subscription.updated':
      const updatedSub = event.data.object;
      console.log(`🔄 Subscription updated: ${updatedSub.id}`);
      console.log(`   Status: ${updatedSub.status}`);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      console.log(`❌ Subscription canceled: ${deletedSub.id}`);
      // TODO: Revoke access to monitoring features
      break;

    case 'invoice.paid':
      const invoice = event.data.object;
      console.log(`💰 Invoice paid: ${invoice.id}`);
      console.log(`   Amount: $${invoice.amount_paid / 100}`);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`❌ Payment failed: ${failedInvoice.id}`);
      console.log(`   Customer: ${failedInvoice.customer}`);
      // TODO: Send notification to customer
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// GET /api/payments/config
// Get Stripe publishable key
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

module.exports = router;
