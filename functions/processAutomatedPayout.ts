import { getBase44Client } from './_shared/base44Client.ts';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  const base44 = getBase44Client(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, payoutMethodId } = await req.json();

    // Get user data
    const appUsers = await base44.entities.AppUser.filter({ created_by: user.email });
    if (appUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const appUser = appUsers[0];

    // Validate balance
    if (appUser.balance < amount) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Get payout method
    const payoutMethods = await base44.entities.PayoutMethod.filter({ 
      id: payoutMethodId,
      userId: appUser.id 
    });
    
    if (payoutMethods.length === 0) {
      return Response.json({ error: 'Payout method not found' }, { status: 404 });
    }
    const payoutMethod = payoutMethods[0];

    // Create Stripe payout
    let stripeTransfer;
    try {
      // Create a transfer to the connected account or payout
      stripeTransfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: payoutMethod.stripePaymentMethodId,
        description: `Withdrawal for ${user.email}`,
        metadata: {
          user_id: appUser.id,
          user_email: user.email,
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });
    } catch (stripeError) {
      console.error('Stripe payout error:', stripeError);
      
      // Create failed transaction record
      await base44.asServiceRole.entities.Transaction.create({
        userId: appUser.id,
        type: 'withdrawal',
        amount: -amount,
        status: 'failed',
        balanceBefore: appUser.balance,
        balanceAfter: appUser.balance,
        metadata: {
          error: stripeError.message,
          payoutMethodId: payoutMethodId,
          stripeError: stripeError.type
        }
      });

      // Send failure notification
      await base44.asServiceRole.functions.invoke('createNotification', {
        userId: appUser.id,
        title: 'Withdrawal Failed',
        message: `Your withdrawal of $${amount.toFixed(2)} failed. Please check your payment method or contact support.`,
        type: 'error',
        priority: 'high'
      });

      return Response.json({ 
        error: 'Payout failed', 
        details: stripeError.message 
      }, { status: 400 });
    }

    // Update user balance
    const newBalance = appUser.balance - amount;
    await base44.asServiceRole.entities.AppUser.update(appUser.id, {
      balance: newBalance
    });

    // Create successful transaction record
    const transaction = await base44.asServiceRole.entities.Transaction.create({
      userId: appUser.id,
      type: 'withdrawal',
      amount: -amount,
      status: 'completed',
      balanceBefore: appUser.balance,
      balanceAfter: newBalance,
      metadata: {
        stripeTransferId: stripeTransfer.id,
        payoutMethodId: payoutMethodId,
        automated: false
      }
    });

    // Send success notification
    await base44.asServiceRole.functions.invoke('createNotification', {
      userId: appUser.id,
      title: 'Withdrawal Successful',
      message: `Your withdrawal of $${amount.toFixed(2)} has been processed successfully.`,
      type: 'success',
      priority: 'medium'
    });

    return Response.json({
      success: true,
      transaction,
      newBalance,
      stripeTransferId: stripeTransfer.id
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    return Response.json({ 
      error: 'Failed to process payout',
      details: error.message 
    }, { status: 500 });
  }
});