import { getBase44Client } from './_shared/base44Client.ts';

/**
 * Creates a training account linked to a referrer's invitation code.
 * Training accounts can earn profits that will be shared (20%) with the referrer.
 * 
 * Request body:
 * {
 *   "phone": "user phone number",
 *   "inviteCode": "referrer's 6-char invitation code",
 *   "accountName": "Training Account Name (optional)"
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const { phone, inviteCode, accountName } = await req.json();

    // Validate inputs
    if (!phone || !inviteCode) {
      return Response.json(
        { error: 'Phone and invitation code are required' },
        { status: 400 }
      );
    }

    // Find the referrer using the invitation code
    const referrers = await base44.asServiceRole.entities.AppUser.filter({
      invitationCode: inviteCode.toUpperCase()
    });

    if (!referrers.length) {
      return Response.json(
        { error: 'Invalid invitation code' },
        { status: 400 }
      );
    }

    const referrer = referrers[0];

    // Generate unique training account code
    const trainingAccountCode = `TRAIN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const trainingAccountName = accountName || `Training Account #${Date.now()}`;

    // Create the training account
    const trainingAccount = await base44.asServiceRole.entities.AppUser.create({
      phone: phone,
      invitationCode: trainingAccountCode,
      referredBy: referrer.id,
      balance: 0,
      vipLevel: 'Bronze',
      creditScore: 100,
      emailVerified: false,
      isTrainingAccount: true,
      trainingAccountName: trainingAccountName,
      parentAccountId: referrer.id,
      language: 'en',
      accountType: 'training',
      created_by: phone // Use phone as identifier for training accounts
    });

    // Create initial tracking record for training account
    await base44.asServiceRole.entities.TrainingAccountLog.create({
      trainingAccountId: trainingAccount.id,
      referrerId: referrer.id,
      accountName: trainingAccountName,
      createdAt: new Date().toISOString(),
      totalEarnings: 0,
      totalSharedProfit: 0,
      status: 'active'
    });

    // Notify the referrer
    if (referrer.created_by) {
      const referrerUsers = await base44.asServiceRole.entities.User.filter({
        email: referrer.created_by
      });

      if (referrerUsers.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          userId: referrerUsers[0].id,
          type: 'training_account_created',
          title: '🎓 Training Account Created!',
          message: `A new training account "${trainingAccountName}" has been created under your referral code. You will receive 20% of its profits!`,
          priority: 'medium',
          read: false
        });
      }
    }

    return Response.json({
      success: true,
      trainingAccount: {
        id: trainingAccount.id,
        phone: trainingAccount.phone,
        accountName: trainingAccountName,
        invitationCode: trainingAccountCode,
        referrerId: referrer.id,
        createdAt: new Date().toISOString()
      },
      message: 'Training account created successfully'
    });

  } catch (error) {
    console.error('Error creating training account:', error);
    return Response.json(
      { error: error.message || 'Failed to create training account' },
      { status: 500 }
    );
  }
});
