import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tierId, billingCycle } = await req.json();

    // Get tier details
    const tier = await base44.entities.SubscriptionTier.filter({ id: tierId });
    if (!tier || tier.length === 0) {
      return Response.json({ error: 'Tier not found' }, { status: 404 });
    }

    const selectedTier = tier[0];
    const price = billingCycle === "yearly" ? selectedTier.yearlyPrice : selectedTier.price;
    const priceId = billingCycle === "yearly" ? selectedTier.stripeYearlyPriceId : selectedTier.stripePriceId;

    // Check if running in iframe
    const referer = req.headers.get('referer') || '';
    const isIframe = referer.includes('/preview') || referer.includes('iframe');
    
    if (isIframe) {
      return Response.json({ 
        error: 'Checkout only works from published app',
        isIframe: true 
      }, { status: 400 });
    }

    // Create or get Stripe customer
    let customerId;
    const existingSubs = await base44.entities.UserSubscription.filter({ userId: user.id });
    
    if (existingSubs.length > 0 && existingSubs[0].stripeCustomerId) {
      customerId = existingSubs[0].stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          base44_app_id: Deno.env.get("BASE44_APP_ID")
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${selectedTier.tierName} Subscription`,
            description: selectedTier.description,
          },
          unit_amount: Math.round(price * 100),
          recurring: {
            interval: billingCycle === "yearly" ? "year" : "month"
          }
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}?subscription=success`,
      cancel_url: `${req.headers.get('origin')}?subscription=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_id: user.id,
        tier_id: tierId,
        billing_cycle: billingCycle
      }
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});