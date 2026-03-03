import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const { referrerId, refereeId, commissionAmount } = await req.json();

    if (!referrerId || !refereeId || !commissionAmount) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get referral settings
    let settings = {
      referrerBonus: 20,
      referrerBonusType: 'percentage',
      refereeBonus: 5,
      refereeBonusType: 'fixed'
    };

    try {
      const appSettings = await base44.asServiceRole.entities.AppSettings.get('referral_settings');
      if (appSettings?.value) {
        settings = { ...settings, ...appSettings.value };
      }
    } catch (error) {
      console.log('Using default referral settings');
    }

    // Calculate bonuses
    const referrerBonusAmount = settings.referrerBonusType === 'percentage'
      ? (commissionAmount * settings.referrerBonus) / 100
      : settings.referrerBonus;

    const refereeBonusAmount = settings.refereeBonusType === 'percentage'
      ? (commissionAmount * settings.refereeBonus) / 100
      : settings.refereeBonus;

    // Award referrer bonus
    const referrer = await base44.asServiceRole.entities.AppUser.get(referrerId);
    if (referrer) {
      await base44.asServiceRole.entities.AppUser.update(referrerId, {
        balance: (referrer.balance || 0) + referrerBonusAmount
      });

      // Log the referral earning
      await base44.asServiceRole.entities.ReferralEarning.create({
        referrerId,
        referredUserId: refereeId,
        commissionAmount,
        referralCommission: referrerBonusAmount,
        status: 'paid'
      });

      // Send notification to referrer
      try {
        const referrerUser = await base44.asServiceRole.entities.User.filter(
          { email: referrer.created_by }
        );
        if (referrerUser.length > 0) {
          await base44.asServiceRole.entities.Notification.create({
            userId: referrerUser[0].id,
            type: 'referral_bonus',
            title: '💰 Referral Bonus Earned!',
            message: `You earned $${referrerBonusAmount.toFixed(2)} from your referral!`,
            priority: 'medium',
            read: false
          });
        }
      } catch (notifError) {
        console.log('Failed to notify referrer:', notifError.message);
      }
    }

    // Award referee welcome bonus (one-time)
    const referee = await base44.asServiceRole.entities.AppUser.get(refereeId);
    if (referee && !referee.referralBonusReceived) {
      await base44.asServiceRole.entities.AppUser.update(refereeId, {
        balance: (referee.balance || 0) + refereeBonusAmount,
        referralBonusReceived: true
      });

      // Send notification to referee
      try {
        const refereeUser = await base44.asServiceRole.entities.User.filter(
          { email: referee.created_by }
        );
        if (refereeUser.length > 0) {
          await base44.asServiceRole.entities.Notification.create({
            userId: refereeUser[0].id,
            type: 'welcome_bonus',
            title: '🎉 Welcome Bonus Received!',
            message: `You received a $${refereeBonusAmount.toFixed(2)} welcome bonus!`,
            priority: 'medium',
            read: false
          });
        }
      } catch (notifError) {
        console.log('Failed to notify referee:', notifError.message);
      }
    }

    return Response.json({
      success: true,
      referrerBonus: referrerBonusAmount,
      refereeBonus: refereeBonusAmount
    });
  } catch (error) {
    console.error('Award referral bonus error:', error);
    return Response.json(
      { error: error.message || 'Failed to award referral bonus' },
      { status: 500 }
    );
  }
});