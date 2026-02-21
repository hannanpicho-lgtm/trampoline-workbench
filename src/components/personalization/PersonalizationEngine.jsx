// Analyzes user data to generate personalization insights
export const analyzeUserBehavior = (appUser, userTasks = []) => {
  const insights = {
    preferredTaskType: 'standard',
    recommendedVIPGoal: null,
    suggestedFocus: [],
    engagementLevel: 'moderate',
    nextMilestone: null,
    taskCompletionRate: 0
  };

  if (!appUser) return insights;

  // Task completion rate
  const completedTasks = userTasks.filter(t => t.status === 'approved' || t.status === 'completed').length;
  const totalTasks = userTasks.length;
  insights.taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Engagement level based on success rate and streak
  if ((appUser.successRate || 100) >= 90 && (appUser.currentStreak || 0) >= 7) {
    insights.engagementLevel = 'high';
  } else if ((appUser.successRate || 100) >= 70 && (appUser.currentStreak || 0) >= 3) {
    insights.engagementLevel = 'moderate-high';
  } else if ((appUser.successRate || 100) >= 50) {
    insights.engagementLevel = 'moderate';
  } else {
    insights.engagementLevel = 'low';
  }

  // Suggested focus areas
  if ((appUser.currentStreak || 0) < 3) {
    insights.suggestedFocus.push('Build daily streak for bonus points');
  }
  if ((appUser.creditScore || 100) < 80) {
    insights.suggestedFocus.push('Improve credit score by completing tasks consistently');
  }
  if ((appUser.inviteCount || 0) < 3) {
    insights.suggestedFocus.push('Refer friends to earn extra bonuses');
  }

  // VIP progression
  const vipLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const currentVIPIndex = vipLevels.indexOf(appUser.vipLevel || 'Bronze');
  const nextVIPLevel = vipLevels[currentVIPIndex + 1];
  
  if (nextVIPLevel) {
    const vipThresholds = { Silver: 50, Gold: 200, Platinum: 500, Diamond: 1000 };
    const tasksNeeded = vipThresholds[nextVIPLevel] - (appUser.tasksCompleted || 0);
    insights.nextMilestone = {
      level: nextVIPLevel,
      tasksNeeded: Math.max(0, tasksNeeded),
      progress: ((appUser.tasksCompleted || 0) / vipThresholds[nextVIPLevel]) * 100
    };
  }

  return insights;
};

// Generate product recommendations based on user behavior
export const getProductRecommendations = (userTasks = [], products = [], appUser = null) => {
  if (!products || products.length === 0) return [];

  // Get completed products
  const completedProductIds = new Set(
    userTasks
      .filter(t => t.status === 'approved' || t.status === 'completed')
      .map(t => t.productId)
  );

  // Get pending products
  const pendingProductIds = new Set(
    userTasks
      .filter(t => t.status === 'pending')
      .map(t => t.productId)
  );

  const available = products.filter(
    p => !completedProductIds.has(p.id) && !pendingProductIds.has(p.id)
  );

  if (available.length === 0) return [];

  // Score products based on user VIP and performance
  const vipLevelIndex = { Bronze: 0, Silver: 1, Gold: 2, Platinum: 3, Diamond: 4 };
  const userVIPIndex = vipLevelIndex[appUser?.vipLevel || 'Bronze'] || 0;
  const userPerformance = (appUser?.successRate || 100) / 100;

  const scored = available.map(product => {
    let score = 0;

    // High-value tasks for high-performance users
    if (appUser && userPerformance > 0.9 && product.price > 500) {
      score += 10;
    }

    // Medium-value tasks for consistent users
    if (appUser && (appUser.currentStreak || 0) >= 5 && product.price > 100) {
      score += 5;
    }

    // Lower-value tasks for newer users
    if (userVIPIndex === 0 && product.price < 200) {
      score += 8;
    }

    // Variety (not just repeating similar products)
    score += Math.random() * 3;

    return { ...product, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
};

// Get content recommendations based on user preferences
export const getContentRecommendations = (appUser) => {
  const recommendations = [];

  if (appUser?.vipLevel === 'Bronze' || appUser?.vipLevel === 'Silver') {
    recommendations.push({
      type: 'info',
      title: 'Complete More Tasks to Level Up',
      message: 'Each task you complete brings you closer to the next VIP tier with better rewards',
      action: 'Start New Task',
      priority: 'high'
    });
  }

  if ((appUser?.currentStreak || 0) === 0) {
    recommendations.push({
      type: 'motivation',
      title: 'Start Your Daily Streak',
      message: 'Complete a task today to start earning streak bonuses',
      action: 'View Tasks',
      priority: 'high'
    });
  }

  if ((appUser?.creditScore || 100) < 70) {
    recommendations.push({
      type: 'warning',
      title: 'Your Credit Score is Declining',
      message: 'Keep completing tasks to maintain and improve your credit score',
      action: 'Learn More',
      priority: 'medium'
    });
  }

  if ((appUser?.inviteCount || 0) === 0) {
    recommendations.push({
      type: 'bonus',
      title: 'Invite Friends and Earn',
      message: 'Share your invitation code with friends to earn referral bonuses',
      action: 'Share Code',
      priority: 'medium'
    });
  }

  if ((appUser?.points || 0) > 500) {
    recommendations.push({
      type: 'achievement',
      title: 'Great Progress!',
      message: `You've earned ${appUser.points} points! Check the leaderboard to see your rank`,
      action: 'View Leaderboard',
      priority: 'low'
    });
  }

  return recommendations;
};