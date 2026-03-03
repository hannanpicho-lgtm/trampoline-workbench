import { getBase44Client } from './_shared/base44Client.ts';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();

    // Get item details
    const items = await base44.entities.InAppPurchase.filter({ id: itemId });
    if (!items || items.length === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = items[0];

    // Check purchase limit
    if (item.limitPerUser) {
      const userPurchases = await base44.entities.PurchaseHistory.filter({ 
        userId: user.id, 
        itemId: itemId,
        status: 'completed'
      });
      
      if (userPurchases.length >= item.limitPerUser) {
        return Response.json({ 
          error: `Purchase limit reached (${item.limitPerUser} max)` 
        }, { status: 400 });
      }
    }

    // Check if running in iframe
    const referer = req.headers.get('referer') || '';
    const isIframe = referer.includes('/preview') || referer.includes('iframe');
    
    if (isIframe) {
      return Response.json({ 
        error: 'Checkout only works from published app',
        isIframe: true 
      }, { status: 400 });
    }

    const finalPrice = item.discount > 0 
      ? item.price * (1 - item.discount / 100) 
      : item.price;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.itemName,
            description: item.description,
            images: item.imageUrl ? [item.imageUrl] : []
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}?purchase=success`,
      cancel_url: `${req.headers.get('origin')}?purchase=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_id: user.id,
        item_id: itemId,
        item_type: item.itemType,
        item_value: item.value
      }
    });

    // Create purchase record
    await base44.asServiceRole.entities.PurchaseHistory.create({
      userId: user.id,
      itemId: itemId,
      itemType: item.itemType,
      amount: finalPrice,
      status: 'pending',
      stripePaymentIntentId: session.payment_intent,
      metadata: { sessionId: session.id }
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Purchase checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});