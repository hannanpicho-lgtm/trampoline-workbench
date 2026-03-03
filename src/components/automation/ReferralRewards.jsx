import { backendClient } from "@/api/backendClient";

/**
 * Award referral bonus to the referrer
 */
export async function awardReferralBonus(referrerId, referredUserId, bonusType) {
  try {
    // Check if bonus already awarded
    const existing = await backendClient.entities.ReferralBonus.filter({
      referrerId,
      referredUserId,
      bonusType
    });

    if (existing.length > 0) {
      return { success: false, message: "Bonus already awarded" };
    }

    // Determine bonus amount
    const bonusAmounts = {
      signup: 5,
      first_task: 10,
      milestone_10: 25,
      milestone_50: 50
    };

    const amount = bonusAmounts[bonusType] || 0;

    // Create bonus record
    await backendClient.entities.ReferralBonus.create({
      referrerId,
      referredUserId,
      bonusType,
      amount,
      status: "paid"
    });

    // Update referrer's balance
    const referrer = await backendClient.entities.AppUser.filter({ id: referrerId });
    if (referrer.length > 0) {
      await backendClient.entities.AppUser.update(referrerId, {
        balance: (referrer[0].balance || 0) + amount
      });

      // Create transaction record
      await backendClient.entities.Transaction.create({
        userId: referrerId,
        type: "referral",
        amount,
        status: "completed",
        balanceBefore: referrer[0].balance || 0,
        balanceAfter: (referrer[0].balance || 0) + amount,
        metadata: { bonusType, referredUserId }
      });
    }

    return { success: true, amount };
  } catch (error) {
    console.error("Failed to award referral bonus:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Process referral signup bonus
 */
export async function processSignupBonus(newUserId, referrerId) {
  if (!referrerId) return;
  
  await awardReferralBonus(referrerId, newUserId, "signup");
}

/**
 * Check and award milestone bonuses when user completes tasks
 */
export async function checkReferralMilestones(userId) {
  try {
    const user = await backendClient.entities.AppUser.filter({ id: userId });
    if (user.length === 0 || !user[0].referredBy) return;

    const tasksCompleted = user[0].tasksCompleted || 0;
    const referrerId = user[0].referredBy;

    // Check for first task bonus
    if (tasksCompleted === 1) {
      await awardReferralBonus(referrerId, userId, "first_task");
    }

    // Check for 10 tasks milestone
    if (tasksCompleted === 10) {
      await awardReferralBonus(referrerId, userId, "milestone_10");
    }

    // Check for 50 tasks milestone
    if (tasksCompleted === 50) {
      await awardReferralBonus(referrerId, userId, "milestone_50");
    }
  } catch (error) {
    console.error("Failed to check referral milestones:", error);
  }
}