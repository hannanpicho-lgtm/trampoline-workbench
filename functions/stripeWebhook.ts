import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  let event;
  
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata;
        
        if (session.mode === 'subscription') {
          // Handle subscription purchase
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          await base44.asServiceRole.entities.UserSubscription.create({
            userId: metadata.user_id,
            tierId: metadata.tier_id,
            status: 'active',
            billingCycle: metadata.billing_cycle,
            startDate: new Date().toISOString(),
            endDate: new Date(subscription.current_period_end * 1000).toISOString(),
            autoRenew: true,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer
          });

          // Send notification
          await base44.asServiceRole.entities.Notification.create({
            userId: metadata.user_id,
            type: 'system',
            title: 'Subscription Activated',
            message: 'Your premium subscription is now active!',
            priority: 'high'
          });
        } else {
          // Handle one-time purchase
          const purchases = await base44.asServiceRole.entities.PurchaseHistory.filter({
            userId: metadata.user_id,
            itemId: metadata.item_id,
            status: 'pending'
          });

          if (purchases.length > 0) {
            const purchase = purchases[0];
            
            // Update purchase status
            await base44.asServiceRole.entities.PurchaseHistory.update(purchase.id, {
              status: 'completed',
              appliedAt: new Date().toISOString(),
              stripePaymentIntentId: session.payment_intent
            });

            // Apply benefit based on item type
            const appUsers = await base44.asServiceRole.entities.AppUser.filter({
              created_by: metadata.user_id
            });

            if (appUsers.length > 0) {
              const appUser = appUsers[0];
              
              switch (metadata.item_type) {
                case 'balance_bonus':
                  await base44.asServiceRole.entities.AppUser.update(appUser.id, {
                    balance: (appUser.balance || 0) + parseFloat(metadata.item_value)
                  });
                  break;
                  
                case 'task_refresh':
                  await base44.asServiceRole.entities.AppUser.update(appUser.id, {
                    dailyRefreshCount: Math.max(0, (appUser.dailyRefreshCount || 0) - parseFloat(metadata.item_value))
                  });
                  break;
                  
                case 'commission_boost':
                  // Implement commission boost logic
                  break;
              }
            }

            // Send notification
            await base44.asServiceRole.entities.Notification.create({
              userId: metadata.user_id,
              type: 'system',
              title: 'Purchase Complete',
              message: 'Your purchase has been applied to your account!',
              priority: 'high'
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        const subs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripeSubscriptionId: subscription.id
        });

        if (subs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(subs[0].id, {
            status: subscription.status,
            endDate: new Date(subscription.current_period_end * 1000).toISOString()
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const subs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripeSubscriptionId: subscription.id
        });

        if (subs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(subs[0].id, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});