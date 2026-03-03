import { getBase44Client } from './_shared/base44Client.ts';

/**
 * Processes profit sharing for training accounts.
 * When a training account completes tasks and earns commission,
 * 20% of that profit is automatically paid to the referrer.
 * 
 * Called after a training account task is completed.
 * 
 * Request body:
 * {
 *   "trainingAccountId": "id of training account",
 *   "taskEarnings": amount earned from task completion
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const { trainingAccountId, taskEarnings } = await req.json();

    if (!trainingAccountId || taskEarnings === undefined) {
      return Response.json(
        { error: 'Training account ID and task earnings are required' },
        { status: 400 }
      );
    }

    // Get the training account
    const trainingAccounts = await base44.asServiceRole.entities.AppUser.filter({
      id: trainingAccountId
    });

    if (!trainingAccounts.length) {
      return Response.json(
        { error: 'Training account not found' },
        { status: 404 }
      );
    }

    const trainingAccount = trainingAccounts[0];

    // Verify it's a training account
    if (!trainingAccount.isTrainingAccount || trainingAccount.accountType !== 'training') {
      return Response.json(
        { error: 'Account is not a training account' },
        { status: 400 }
      );
    }

    // Get the referrer account
    const referrers = await base44.asServiceRole.entities.AppUser.filter({
      id: trainingAccount.referredBy || trainingAccount.parentAccountId
    });

    if (!referrers.length) {
      return Response.json(
        { error: 'Referrer account not found' },
        { status: 404 }
      );
    }

    const referrer = referrers[0];

    // Calculate 20% profit share
    const profitSharePercentage = 0.20;
    const profitShare = taskEarnings * profitSharePercentage;

    // Update referrer's balance
    const newReferrerBalance = (referrer.balance || 0) + profitShare;
    await base44.asServiceRole.entities.AppUser.update(referrer.id, {
      balance: newReferrerBalance
    });

    // Create transaction record for the profit share
    await base44.asServiceRole.entities.Transaction.create({
      userId: referrer.id,
      type: 'training_profit_share',
      amount: profitShare,
      status: 'completed',
      balanceBefore: referrer.balance || 0,
      balanceAfter: newReferrerBalance,
      metadata: {
        trainingAccountId: trainingAccountId,
        trainingAccountName: trainingAccount.trainingAccountName,
        originalEarnings: taskEarnings,
        sharePercentage: profitSharePercentage * 100,
        sharerPhone: trainingAccount.phone
      }
    });

    // Update training account log
    const logs = await base44.asServiceRole.entities.TrainingAccountLog.filter({
      trainingAccountId: trainingAccountId
    });

    if (logs.length > 0) {
      const log = logs[0];
      await base44.asServiceRole.entities.TrainingAccountLog.update(log.id, {
        totalEarnings: (log.totalEarnings || 0) + taskEarnings,
        totalSharedProfit: (log.totalSharedProfit || 0) + profitShare
      });
    }

    // Notify the referrer about the profit share
    if (referrer.created_by) {
      const referrerUsers = await base44.asServiceRole.entities.User.filter({
        email: referrer.created_by
      });

      if (referrerUsers.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          userId: referrerUsers[0].id,
          type: 'training_profit_share',
          title: '💵 Training Account Profit Share!',
          message: `You earned $${profitShare.toFixed(2)} (20% of $${taskEarnings.toFixed(2)}) from task completions in "${trainingAccount.trainingAccountName}"!`,
          priority: 'medium',
          read: false
        });
      }
    }

    return Response.json({
      success: true,
      profitShare: profitShare,
      newReferrerBalance: newReferrerBalance,
      trainingAccountEarnings: taskEarnings,
      sharePercentage: profitSharePercentage * 100,
      message: 'Profit share processed successfully'
    });

  } catch (error) {
    console.error('Error processing training profit share:', error);
    return Response.json(
      { error: error.message || 'Failed to process profit share' },
      { status: 500 }
    );
  }
});
