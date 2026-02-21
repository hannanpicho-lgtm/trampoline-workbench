// Calculate rewards based on task completion
export function calculateTaskRewards(task, appUser, vipData) {
  const rewards = {
    commission: task.commission || 0,
    bonusPoints: 0,
    bonusCurrency: 0,
    streakBonus: 0,
    vipBonus: 0,
    premiumBonus: 0,
    performanceBonus: 0,
    totalReward: 0,
    badges: [],
    boosts: []
  };

  // Base points (10 points per task)
  rewards.bonusPoints = 10;

  // VIP bonus points
  const vipPointsMultiplier = {
    Bronze: 1.0,
    Silver: 1.2,
    Gold: 1.5,
    Platinum: 2.0,
    Diamond: 2.5
  };
  const vipMultiplier = vipPointsMultiplier[vipData.level] || 1.0;
  rewards.vipBonus = Math.floor(rewards.bonusPoints * (vipMultiplier - 1));
  rewards.bonusPoints = Math.floor(rewards.bonusPoints * vipMultiplier);

  // Premium order bonus (if applicable)
  if (task.isPremiumOrder) {
    rewards.premiumBonus = 50; // Extra 50 points for premium orders
    rewards.bonusPoints += rewards.premiumBonus;
    rewards.bonusCurrency = task.commission * 0.1; // 10% extra currency
  }

  // Performance bonus (based on success rate)
  const successRate = appUser.successRate || 100;
  if (successRate >= 95) {
    rewards.performanceBonus = 20;
    rewards.bonusPoints += rewards.performanceBonus;
  } else if (successRate >= 90) {
    rewards.performanceBonus = 10;
    rewards.bonusPoints += rewards.performanceBonus;
  }

  // Streak bonus
  const streak = appUser.currentStreak || 0;
  if (streak >= 7) {
    rewards.streakBonus = 30;
    rewards.bonusCurrency += 5;
  } else if (streak >= 3) {
    rewards.streakBonus = 15;
    rewards.bonusCurrency += 2;
  }
  rewards.bonusPoints += rewards.streakBonus;

  // High-value task bonus
  if (task.commission >= 50) {
    rewards.bonusCurrency += 10;
    rewards.boosts.push({ type: "high_value", label: "High Value Task Bonus", value: "+$10" });
  }

  // Milestone rewards
  const totalCompleted = (appUser.tasksCompleted || 0) + 1;
  if (totalCompleted % 10 === 0) {
    rewards.bonusPoints += 50;
    rewards.bonusCurrency += 15;
    rewards.boosts.push({ type: "milestone", label: "Milestone Achievement", value: `${totalCompleted} Tasks!` });
  }

  rewards.totalReward = rewards.commission + rewards.bonusCurrency;

  return rewards;
}

// Format rewards for display
export function formatRewardsSummary(rewards) {
  const items = [];
  
  items.push({
    icon: "💰",
    label: "Commission",
    value: `$${rewards.commission.toFixed(2)}`,
    color: "text-green-600"
  });

  if (rewards.bonusCurrency > 0) {
    items.push({
      icon: "🎁",
      label: "Bonus Currency",
      value: `$${rewards.bonusCurrency.toFixed(2)}`,
      color: "text-blue-600"
    });
  }

  items.push({
    icon: "⭐",
    label: "Points Earned",
    value: `+${rewards.bonusPoints}`,
    color: "text-purple-600"
  });

  if (rewards.streakBonus > 0) {
    items.push({
      icon: "🔥",
      label: "Streak Bonus",
      value: `+${rewards.streakBonus} pts`,
      color: "text-orange-600"
    });
  }

  if (rewards.vipBonus > 0) {
    items.push({
      icon: "👑",
      label: "VIP Bonus",
      value: `+${rewards.vipBonus} pts`,
      color: "text-amber-600"
    });
  }

  if (rewards.premiumBonus > 0) {
    items.push({
      icon: "💎",
      label: "Premium Bonus",
      value: `+${rewards.premiumBonus} pts`,
      color: "text-indigo-600"
    });
  }

  if (rewards.performanceBonus > 0) {
    items.push({
      icon: "🎯",
      label: "Performance Bonus",
      value: `+${rewards.performanceBonus} pts`,
      color: "text-teal-600"
    });
  }

  return items;
}