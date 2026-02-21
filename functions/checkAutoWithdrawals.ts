import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    // This is an admin-only scheduled function
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting auto-withdrawal check...');
    
    // Get all enabled auto-withdrawal settings
    const settings = await base44.asServiceRole.entities.AutoWithdrawalSettings.filter({
      isEnabled: true
    });

    console.log(`Found ${settings.length} enabled auto-withdrawal settings`);

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    for (const setting of settings) {
      try {
        // Get user data
        const appUser = await base44.asServiceRole.entities.AppUser.filter({ id: setting.userId });
        if (appUser.length === 0) {
          results.skipped++;
          results.details.push({ userId: setting.userId, status: 'user_not_found' });
          continue;
        }
        const user = appUser[0];

        // Check if balance meets threshold
        if (user.balance < setting.thresholdAmount) {
          results.skipped++;
          results.details.push({ 
            userId: setting.userId, 
            status: 'below_threshold',
            balance: user.balance,
            threshold: setting.thresholdAmount
          });
          continue;
        }

        // Check frequency
        if (setting.lastProcessedAt) {
          const lastProcessed = new Date(setting.lastProcessedAt);
          const now = new Date();
          const hoursSinceLastProcess = (now - lastProcessed) / (1000 * 60 * 60);
          
          if (setting.frequency === 'daily' && hoursSinceLastProcess < 24) continue;
          if (setting.frequency === 'weekly' && hoursSinceLastProcess < 168) continue;
          if (setting.frequency === 'monthly' && hoursSinceLastProcess < 720) continue;
        }

        // Determine withdrawal amount
        let withdrawAmount;
        if (setting.withdrawalAmount === 'full_balance') {
          withdrawAmount = user.balance;
        } else if (setting.withdrawalAmount === 'threshold_only') {
          withdrawAmount = setting.thresholdAmount;
        } else if (setting.withdrawalAmount === 'custom' && setting.customAmount) {
          withdrawAmount = Math.min(setting.customAmount, user.balance);
        } else {
          withdrawAmount = user.balance;
        }

        // Get payout method
        const payoutMethods = await base44.asServiceRole.entities.PayoutMethod.filter({
          id: setting.paymentMethodId,
          userId: setting.userId
        });

        if (payoutMethods.length === 0) {
          results.failed++;
          results.details.push({ userId: setting.userId, status: 'no_payout_method' });
          
          // Notify user
          await base44.asServiceRole.functions.invoke('createNotification', {
            userId: setting.userId,
            title: 'Auto-Withdrawal Failed',
            message: 'No valid payment method found. Please update your auto-withdrawal settings.',
            type: 'error',
            priority: 'high'
          });
          continue;
        }

        const payoutMethod = payoutMethods[0];

        // Process Stripe payout
        try {
          const stripeTransfer = await stripe.transfers.create({
            amount: Math.round(withdrawAmount * 100),
            currency: 'usd',
            destination: payoutMethod.stripePaymentMethodId,
            description: `Auto-withdrawal for user ${setting.userId}`,
            metadata: {
              user_id: setting.userId,
              automated: 'true',
              base44_app_id: Deno.env.get('BASE44_APP_ID')
            }
          });

          // Update user balance
          const newBalance = user.balance - withdrawAmount;
          await base44.asServiceRole.entities.AppUser.update(user.id, {
            balance: newBalance
          });

          // Create transaction record
          await base44.asServiceRole.entities.Transaction.create({
            userId: setting.userId,
            type: 'withdrawal',
            amount: -withdrawAmount,
            status: 'completed',
            balanceBefore: user.balance,
            balanceAfter: newBalance,
            metadata: {
              stripeTransferId: stripeTransfer.id,
              payoutMethodId: setting.paymentMethodId,
              automated: true,
              autoWithdrawalSettingId: setting.id
            }
          });

          // Update last processed time
          await base44.asServiceRole.entities.AutoWithdrawalSettings.update(setting.id, {
            lastProcessedAt: new Date().toISOString()
          });

          // Send success notification
          await base44.asServiceRole.functions.invoke('createNotification', {
            userId: setting.userId,
            title: 'Auto-Withdrawal Processed',
            message: `$${withdrawAmount.toFixed(2)} has been automatically withdrawn to your account.`,
            type: 'success',
            priority: 'medium'
          });

          results.processed++;
          results.details.push({
            userId: setting.userId,
            status: 'success',
            amount: withdrawAmount,
            stripeTransferId: stripeTransfer.id
          });

        } catch (stripeError) {
          console.error('Stripe payout error:', stripeError);
          
          // Create failed transaction
          await base44.asServiceRole.entities.Transaction.create({
            userId: setting.userId,
            type: 'withdrawal',
            amount: -withdrawAmount,
            status: 'failed',
            balanceBefore: user.balance,
            balanceAfter: user.balance,
            metadata: {
              error: stripeError.message,
              automated: true,
              payoutMethodId: setting.paymentMethodId
            }
          });

          // Notify user of failure
          await base44.asServiceRole.functions.invoke('createNotification', {
            userId: setting.userId,
            title: 'Auto-Withdrawal Failed',
            message: `Automatic withdrawal of $${withdrawAmount.toFixed(2)} failed. Please check your payment method.`,
            type: 'error',
            priority: 'high'
          });

          results.failed++;
          results.details.push({
            userId: setting.userId,
            status: 'failed',
            error: stripeError.message
          });
        }

      } catch (error) {
        console.error(`Error processing auto-withdrawal for user ${setting.userId}:`, error);
        results.failed++;
        results.details.push({
          userId: setting.userId,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('Auto-withdrawal check completed:', results);

    return Response.json({
      success: true,
      summary: {
        processed: results.processed,
        failed: results.failed,
        skipped: results.skipped,
        total: settings.length
      },
      details: results.details
    });

  } catch (error) {
    console.error('Auto-withdrawal check error:', error);
    return Response.json({ 
      error: 'Failed to check auto-withdrawals',
      details: error.message 
    }, { status: 500 });
  }
});