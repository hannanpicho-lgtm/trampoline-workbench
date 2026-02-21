import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taskId, userId, commissionAmount } = await req.json();

    if (!taskId || !userId || !commissionAmount) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the user who completed the task
    const [appUser] = await base44.asServiceRole.entities.AppUser.filter({ id: userId });

    if (!appUser || !appUser.referredBy) {
      // No referrer, nothing to do
      return Response.json({ 
        success: true, 
        message: 'No referrer found' 
      });
    }

    // Get referrer data
    const [referrer] = await base44.asServiceRole.entities.AppUser.filter({ 
      id: appUser.referredBy 
    });

    if (!referrer) {
      return Response.json({ 
        success: true, 
        message: 'Referrer not found' 
      });
    }

    // VIP-based commission rates
    const vipCommissionRates = {
      'Bronze': 0.20,   // 20%
      'Silver': 0.22,   // 22%
      'Gold': 0.25,     // 25%
      'Platinum': 0.28, // 28%
      'Diamond': 0.30   // 30%
    };

    const commissionRate = vipCommissionRates[referrer.vipLevel || 'Bronze'] || 0.20;
    const referralCommission = commissionAmount * commissionRate;

    // Record the referral earning
    await base44.asServiceRole.entities.ReferralEarning.create({
      referrerId: referrer.id,
      referredUserId: userId,
      commissionAmount: commissionAmount,
      referralCommission: referralCommission,
      taskId: taskId,
      status: 'paid'
    });

    // Update referrer's balance
    const newBalance = (referrer.balance || 0) + referralCommission;
    await base44.asServiceRole.entities.AppUser.update(referrer.id, {
      balance: newBalance
    });

    // Get referrer's User account for notification
    const referrerUser = await base44.asServiceRole.entities.User.filter({ email: referrer.created_by });
    if (referrerUser.length > 0) {
      await base44.asServiceRole.entities.Notification.create({
        userId: referrerUser[0].id,
        type: 'referral_commission',
        title: '💰 Referral Commission Earned!',
        message: `You earned $${referralCommission.toFixed(2)} (${(commissionRate * 100).toFixed(0)}% ${referrer.vipLevel} bonus) from your referral's task!`,
        priority: 'medium',
        read: false
      });
    }

    return Response.json({ 
      success: true, 
      referralCommission: referralCommission,
      referrerBalance: newBalance
    });

  } catch (error) {
    console.error('Error processing referral commission:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});