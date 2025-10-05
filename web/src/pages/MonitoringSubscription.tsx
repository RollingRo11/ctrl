import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Bell,
  Clock,
  Database,
  Sparkles,
  Crown,
  Loader2,
  ExternalLink,
  CreditCard,
  Settings,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface SubscriptionTier {
  name: string;
  price: number;
  features: string[];
}

interface Tiers {
  basic: SubscriptionTier;
  pro: SubscriptionTier;
  enterprise: SubscriptionTier;
}

const MonitoringSubscription = () => {
  const [tiers, setTiers] = useState<Tiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    // Load Stripe publishable key
    fetch(`${API_URL}/api/payments/config`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(err => console.error("Error loading Stripe config:", err));

    // Fetch subscription tiers
    fetch(`${API_URL}/api/payments/subscription-tiers`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTiers(data.tiers);
        }
      })
      .catch(err => console.error("Error fetching tiers:", err))
      .finally(() => setLoading(false));

    // Check for existing subscription (mock for now)
    const mockSubscription = localStorage.getItem("monitoring_subscription");
    if (mockSubscription) {
      setCurrentSubscription(JSON.parse(mockSubscription));
    }
  }, []);

  const handleSubscribe = async (tierKey: string) => {
    setCheckoutLoading(tierKey);
    try {
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: tierKey,
          successUrl: `${window.location.origin}/monitoring?success=true`,
          cancelUrl: `${window.location.origin}/monitoring?canceled=true`,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      // In a real app, you'd have the customer ID stored
      const customerId = localStorage.getItem("stripe_customer_id");

      if (!customerId) {
        alert("No customer ID found. Please contact support.");
        return;
      }

      const response = await fetch(`${API_URL}/api/payments/create-customer-portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      alert("Failed to open billing portal. Please try again.");
    }
  };

  const getTierIcon = (tierKey: string) => {
    switch (tierKey) {
      case "basic":
        return <BarChart3 className="w-8 h-8 text-blue-500" />;
      case "pro":
        return <Zap className="w-8 h-8 text-terminal-accent" />;
      case "enterprise":
        return <Crown className="w-8 h-8 text-amber-500" />;
      default:
        return <BarChart3 className="w-8 h-8" />;
    }
  };

  const getTierColor = (tierKey: string) => {
    switch (tierKey) {
      case "basic":
        return "border-blue-500/50";
      case "pro":
        return "border-terminal-accent/50 shadow-lg shadow-terminal-accent/20";
      case "enterprise":
        return "border-amber-500/50";
      default:
        return "border-terminal-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-terminal-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-terminal-accent/20 rounded-full">
            <TrendingUp className="w-10 h-10 text-terminal-accent" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Infrastructure Monitoring & Analytics
        </h1>
        <p className="text-terminal-text text-lg max-w-2xl mx-auto">
          Get real-time insights, predictive analytics, and advanced monitoring for your GPU datacenter investments
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="bg-terminal-surface border-terminal-accent p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-terminal-accent/20 rounded-lg">
                <Check className="w-6 h-6 text-terminal-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Active Subscription</h3>
                <p className="text-terminal-text">
                  {currentSubscription.tier} - ${currentSubscription.amount}/month
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-terminal-border text-white hover:bg-terminal-border"
              onClick={handleManageSubscription}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
        </Card>
      )}

      {/* Pricing Tiers */}
      <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
        {tiers && Object.entries(tiers).map(([tierKey, tier]) => {
          const isRecommended = tierKey === "pro";

          return (
            <Card
              key={tierKey}
              className={`bg-terminal-surface border-2 ${getTierColor(tierKey)} p-8 relative transition-all hover:scale-105`}
            >
              {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-terminal-accent text-terminal-bg px-4 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Tier Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getTierIcon(tierKey)}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-5xl font-bold text-white">${tier.price}</span>
                  <span className="text-terminal-text ml-2">/month</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-terminal-accent mt-0.5 flex-shrink-0" />
                    <span className="text-terminal-text text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  isRecommended
                    ? "bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
                    : "bg-terminal-bg border border-terminal-border text-white hover:bg-terminal-border"
                }`}
                onClick={() => handleSubscribe(tierKey)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === tierKey ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Feature Comparison
        </h2>
        <Card className="bg-terminal-surface border-terminal-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-terminal-bg">
                <tr>
                  <th className="text-left py-4 px-6 text-white font-semibold">Feature</th>
                  <th className="text-center py-4 px-6 text-white font-semibold">Basic</th>
                  <th className="text-center py-4 px-6 text-white font-semibold">Pro</th>
                  <th className="text-center py-4 px-6 text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Real-time GPU monitoring", basic: true, pro: true, enterprise: true },
                  { name: "Performance metrics", basic: true, pro: true, enterprise: true },
                  { name: "Email alerts", basic: true, pro: true, enterprise: true },
                  { name: "SMS alerts", basic: false, pro: true, enterprise: true },
                  { name: "Data retention", basic: "7 days", pro: "90 days", enterprise: "Unlimited" },
                  { name: "Custom dashboards", basic: false, pro: true, enterprise: true },
                  { name: "Predictive analytics", basic: false, pro: true, enterprise: true },
                  { name: "API access", basic: false, pro: true, enterprise: true },
                  { name: "AI-powered optimization", basic: false, pro: false, enterprise: true },
                  { name: "White-label reports", basic: false, pro: false, enterprise: true },
                  { name: "Dedicated support", basic: false, pro: false, enterprise: true },
                  { name: "SLA guarantee", basic: false, pro: false, enterprise: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-t border-terminal-border hover:bg-terminal-bg/50">
                    <td className="py-4 px-6 text-white">{row.name}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof row.basic === "boolean" ? (
                        row.basic ? (
                          <Check className="w-5 h-5 text-terminal-accent mx-auto" />
                        ) : (
                          <span className="text-terminal-muted">—</span>
                        )
                      ) : (
                        <span className="text-terminal-text">{row.basic}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="w-5 h-5 text-terminal-accent mx-auto" />
                        ) : (
                          <span className="text-terminal-muted">—</span>
                        )
                      ) : (
                        <span className="text-terminal-text">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <Check className="w-5 h-5 text-terminal-accent mx-auto" />
                        ) : (
                          <span className="text-terminal-muted">—</span>
                        )
                      ) : (
                        <span className="text-terminal-text">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-3 gap-6">
        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Secure & Reliable</h3>
          </div>
          <p className="text-terminal-text">
            Bank-level encryption and 99.9% uptime guarantee for your monitoring data
          </p>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-terminal-accent/20 rounded-lg mr-4">
              <Zap className="w-6 h-6 text-terminal-accent" />
            </div>
            <h3 className="text-xl font-bold text-white">Lightning Fast</h3>
          </div>
          <p className="text-terminal-text">
            Real-time data updates with sub-second latency for instant insights
          </p>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg mr-4">
              <Database className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Scalable Storage</h3>
          </div>
          <p className="text-terminal-text">
            Store and analyze historical data to optimize your infrastructure performance
          </p>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Can I upgrade or downgrade my plan?",
              a: "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades at the end of your billing cycle."
            },
            {
              q: "Is there a free trial?",
              a: "We offer a 14-day free trial for the Pro plan so you can experience advanced features before committing."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, debit cards, and ACH transfers through Stripe."
            },
            {
              q: "Can I cancel anytime?",
              a: "Absolutely! Cancel anytime with no penalties. Your access continues until the end of your billing period."
            }
          ].map((faq, idx) => (
            <Card key={idx} className="bg-terminal-surface border-terminal-border p-6">
              <h4 className="text-lg font-semibold text-white mb-2">{faq.q}</h4>
              <p className="text-terminal-text">{faq.a}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="max-w-4xl mx-auto mt-16">
        <Card className="bg-gradient-to-r from-terminal-accent/20 to-blue-500/20 border-terminal-accent p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to optimize your GPU infrastructure?
          </h2>
          <p className="text-terminal-text text-lg mb-8">
            Start monitoring your datacenter with advanced analytics today
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button
              className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
              onClick={() => handleSubscribe("pro")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Free Trial
            </Button>
            <Button
              variant="outline"
              className="border-terminal-border text-white hover:bg-terminal-border"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringSubscription;
