import { base44 } from "@/api/base44Client";
import { checkReferralMilestones } from "./ReferralRewards";

// Calculate user's success rate and performance
export async function calculateUserPerformance(userId) {
  try {
    const tasks = await base44.entities.UserTask.filter({ userId });
    const completed = tasks.filter(t => t.status === "completed" || t.status === "approved").length;
    const rejected = tasks.filter(t => t.status === "rejected").length;
    const total = tasks.length;
    
    const successRate = total > 0 ? (completed / total) * 100 : 100;
    const avgCompletionTime = tasks.length > 5 ? calculateAvgTime(tasks) : null;
    
    return {
      successRate,
      totalTasks: total,
      completedTasks: completed,
      rejectedTasks: rejected,
      avgCompletionTime,
      performanceLevel: successRate >= 90 ? "excellent" : successRate >= 75 ? "good" : successRate >= 60 ? "average" : "needs_improvement"
    };
  } catch (error) {
    return { successRate: 100, totalTasks: 0, performanceLevel: "new" };
  }
}

function calculateAvgTime(tasks) {
  const completedTasks = tasks.filter(t => t.submittedAt && t.created_date);
  if (completedTasks.length === 0) return null;
  
  const totalTime = completedTasks.reduce((sum, task) => {
    const created = new Date(task.created_date).getTime();
    const submitted = new Date(task.submittedAt).getTime();
    return sum + (submitted - created);
  }, 0);
  
  return totalTime / completedTasks.length;
}

// Automatically assign initial tasks with dynamic difficulty
export async function assignInitialTasks(userId, vipLevel = "Bronze", performanceData = null) {
  try {
    const products = await base44.entities.Product.filter({ isActive: true });
    
    // Get user performance if not provided
    const performance = performanceData || await calculateUserPerformance(userId);
    
    // Get appropriate tasks based on VIP level and performance
    const vipTaskRanges = {
      Bronze: { min: 0, max: 100, count: 3 },
      Silver: { min: 50, max: 250, count: 5 },
      Gold: { min: 150, max: 500, count: 5 },
      Platinum: { min: 300, max: 1000, count: 7 },
      Diamond: { min: 500, max: 10000, count: 10 }
    };

    let range = vipTaskRanges[vipLevel] || vipTaskRanges.Bronze;
    
    // Adjust difficulty based on performance
    if (performance.performanceLevel === "excellent" && performance.totalTasks > 10) {
      // Increase max range for high performers
      range.max = Math.min(range.max * 1.5, 10000);
    } else if (performance.performanceLevel === "needs_improvement") {
      // Lower difficulty for struggling users
      range.max = range.max * 0.7;
    }
    
    const eligibleProducts = products.filter(p => p.price >= range.min && p.price <= range.max);
    
    if (eligibleProducts.length === 0) return 0;

    // Sort by difficulty and select appropriate mix
    const sortedProducts = eligibleProducts.sort((a, b) => a.price - b.price);
    const tasksToAssign = selectBalancedTasks(sortedProducts, range.count, performance);
    
    const offers = tasksToAssign.map(product => ({
      userId: userId,
      productId: product.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      vipLevel: vipLevel
    }));

    await base44.entities.TaskOffer.bulkCreate(offers);
    return offers.length;
  } catch (error) {
    console.error("Failed to assign initial tasks:", error);
    return 0;
  }
}

function selectBalancedTasks(products, count, performance) {
  if (products.length <= count) return products;
  
  // Mix of easy, medium, hard based on performance
  const third = Math.floor(products.length / 3);
  const easy = products.slice(0, third);
  const medium = products.slice(third, third * 2);
  const hard = products.slice(third * 2);
  
  let selected = [];
  if (performance.performanceLevel === "excellent") {
    // More hard tasks
    selected = [...hard.slice(0, Math.ceil(count * 0.6)), ...medium.slice(0, Math.floor(count * 0.4))];
  } else if (performance.performanceLevel === "needs_improvement") {
    // More easy tasks
    selected = [...easy.slice(0, Math.ceil(count * 0.7)), ...medium.slice(0, Math.floor(count * 0.3))];
  } else {
    // Balanced mix
    selected = [...easy.slice(0, Math.floor(count * 0.3)), ...medium.slice(0, Math.ceil(count * 0.4)), ...hard.slice(0, Math.floor(count * 0.3))];
  }
  
  return selected.slice(0, count);
}

// Automatically upgrade VIP level based on tasks completed
export function calculateVIPLevel(tasksCompleted) {
  if (tasksCompleted >= 150) return "Diamond";
  if (tasksCompleted >= 100) return "Platinum";
  if (tasksCompleted >= 60) return "Gold";
  if (tasksCompleted >= 30) return "Silver";
  return "Bronze";
}

// Get VIP commission multiplier
export function getVIPCommissionBonus(vipLevel) {
  const bonuses = {
    Bronze: 0,
    Silver: 5,
    Gold: 10,
    Platinum: 15,
    Diamond: 20
  };
  return bonuses[vipLevel] || 0;
}

// Automatically process task completion rewards
export async function processTaskCompletion(taskId, userId) {
  try {
    const task = await base44.entities.UserTask.filter({ id: taskId });
    if (!task[0]) return null;

    const appUserData = await base44.entities.AppUser.filter({ id: userId });
    if (!appUserData[0]) return null;

    const appUser = appUserData[0];
    const newTasksCompleted = (appUser.tasksCompleted || 0) + 1;
    const newTasksInSet = (appUser.tasksInCurrentSet || 0) + 1;
    const newBalance = (appUser.balance || 0) + task[0].commission;

    // Base points for task completion
    const basePoints = Math.floor(task[0].commission * 10); // 10 points per dollar

    // Check if user completed a set
    const TASKS_PER_SET = 35;
    let needsReset = false;
    let taskSetsCompleted = appUser.taskSetsCompleted || 0;

    if (newTasksInSet >= TASKS_PER_SET) {
      needsReset = true;
      taskSetsCompleted += 1;
    }

    // Determine VIP level
    const vipLevel = calculateVIPLevel(newTasksCompleted);
    const upgraded = vipLevel !== appUser.vipLevel;

    // Update streak and get bonus
    const streakData = await updateStreak(userId, appUser);

    // Update user
    await base44.entities.AppUser.update(userId, {
      tasksCompleted: newTasksCompleted,
      tasksInCurrentSet: newTasksInSet,
      balance: newBalance,
      vipLevel,
      needsReset,
      taskSetsCompleted,
      points: (appUser.points || 0) + basePoints
    });

    // Check and award badges
    const updatedUser = await base44.entities.AppUser.filter({ id: userId });
    const newBadges = await checkAndAwardBadges(userId, updatedUser[0]);

    // Check referral milestones
    await checkReferralMilestones(userId);

    // Update task to approved
    await base44.entities.UserTask.update(taskId, {
      status: "approved",
      approvedAt: new Date().toISOString()
    });

    // Create transaction record
    await base44.entities.Transaction.create({
      userId,
      type: "bonus",
      amount: task[0].commission,
      status: "completed",
      balanceBefore: appUser.balance || 0,
      balanceAfter: newBalance,
      metadata: { taskId, reason: "Task completion reward" }
    });

    return {
      success: true,
      needsReset,
      upgraded,
      newVIPLevel: vipLevel,
      commission: task[0].commission,
      pointsEarned: basePoints,
      streakData,
      newBadges
    };
  } catch (error) {
    console.error("Failed to process task completion:", error);
    return { success: false };
  }
}

// Get VIP upgrade bonus
function getVIPUpgradeBonus(vipLevel) {
  const bonuses = {
    Silver: 50,
    Gold: 150,
    Platinum: 500,
    Diamond: 1500
  };
  return bonuses[vipLevel] || 0;
}

// Automatically generate advanced tasks for high VIP users
export async function generateAdvancedTasks(userId, vipLevel) {
  if (!["Gold", "Platinum", "Diamond"].includes(vipLevel)) return;

  try {
    const products = await base44.entities.Product.filter({ isActive: true });
    const advancedProducts = products.filter(p => p.price >= 100);

    if (advancedProducts.length === 0) return;

    // Higher VIP = more advanced tasks
    const taskCounts = { Gold: 2, Platinum: 3, Diamond: 5 };
    const count = taskCounts[vipLevel] || 2;

    const selectedProducts = advancedProducts
      .sort((a, b) => b.price - a.price)
      .slice(0, count);

    const offers = selectedProducts.map(product => ({
      userId: userId,
      productId: product.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours for advanced tasks
      vipLevel: vipLevel
    }));

    await base44.entities.TaskOffer.bulkCreate(offers);
  } catch (error) {
    console.error("Failed to generate advanced tasks:", error);
  }
}

// Create special event tasks
export async function createSpecialEventTasks() {
  try {
    const products = await base44.entities.Product.filter({ isActive: true });
    const highValueProducts = products.filter(p => p.price >= 500).sort((a, b) => b.price - a.price).slice(0, 3);
    
    if (highValueProducts.length === 0) return;
    
    // Create special event task offers for all active users
    const users = await base44.entities.AppUser.filter({ vipLevel: ["Gold", "Platinum", "Diamond"] });
    
    const eventOffers = [];
    for (const user of users) {
      for (const product of highValueProducts) {
        eventOffers.push({
          userId: user.id,
          productId: product.id,
          status: "pending",
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
          vipLevel: user.vipLevel,
          isSpecialEvent: true
        });
      }
    }
    
    if (eventOffers.length > 0) {
      await base44.entities.TaskOffer.bulkCreate(eventOffers);
    }
    
    return eventOffers.length;
  } catch (error) {
    console.error("Failed to create special event tasks:", error);
    return 0;
  }
}

// Refresh user's available tasks
export async function refreshUserTasks(userId, vipLevel) {
  try {
    // Get current AppUser to check refresh count
    const appUserData = await base44.entities.AppUser.filter({ id: userId });
    if (!appUserData[0]) return { success: false, message: "User not found" };
    
    const user = appUserData[0];
    const today = new Date().toDateString();
    const lastRefresh = user.lastRefreshDate ? new Date(user.lastRefreshDate).toDateString() : null;
    
    // Reset count if it's a new day
    let refreshCount = lastRefresh === today ? (user.dailyRefreshCount || 0) : 0;
    const maxRefreshes = 3; // 3 refreshes per day
    
    if (refreshCount >= maxRefreshes) {
      return { success: false, message: `Daily refresh limit reached (${maxRefreshes}/day)`, remaining: 0 };
    }
    
    // Expire old pending offers
    const oldOffers = await base44.entities.TaskOffer.filter({ userId, status: "pending" });
    for (const offer of oldOffers) {
      await base44.entities.TaskOffer.update(offer.id, { status: "expired" });
    }
    
    // Get performance data
    const performance = await calculateUserPerformance(userId);
    
    // Assign new tasks based on performance
    const tasksAssigned = await assignInitialTasks(userId, vipLevel, performance);
    
    // Update refresh count
    await base44.entities.AppUser.update(userId, {
      dailyRefreshCount: refreshCount + 1,
      lastRefreshDate: new Date().toISOString()
    });
    
    return { 
      success: true, 
      tasksAssigned, 
      remaining: maxRefreshes - (refreshCount + 1),
      performance: performance.performanceLevel
    };
  } catch (error) {
    console.error("Failed to refresh tasks:", error);
    return { success: false, message: "Refresh failed" };
  }
}

// Award badges based on milestones
export async function checkAndAwardBadges(userId, appUser) {
  try {
    const badges = await base44.entities.Badge.list();
    const userBadges = await base44.entities.UserBadge.filter({ userId });
    const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
    
    const newBadges = [];
    
    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge.id)) continue;
      
      let shouldAward = false;
      
      switch (badge.category) {
        case "tasks":
          shouldAward = appUser.tasksCompleted >= badge.requirement;
          break;
        case "vip":
          const vipLevels = { Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5 };
          const currentLevel = vipLevels[appUser.vipLevel] || 0;
          shouldAward = currentLevel >= badge.requirement;
          break;
        case "streak":
          shouldAward = appUser.longestStreak >= badge.requirement;
          break;
        case "earnings":
          shouldAward = appUser.balance >= badge.requirement;
          break;
      }
      
      if (shouldAward) {
        await base44.entities.UserBadge.create({
          userId,
          badgeId: badge.id,
          earnedAt: new Date().toISOString()
        });
        
        // Award points for badge
        if (badge.points > 0) {
          await base44.entities.AppUser.update(userId, {
            points: (appUser.points || 0) + badge.points
          });
        }
        
        newBadges.push(badge);
      }
    }
    
    return newBadges;
  } catch (error) {
    console.error("Failed to check badges:", error);
    return [];
  }
}

// Update streak when task is completed
export async function updateStreak(userId, appUser) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastTaskDate = appUser.lastTaskDate || null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = 1;
    
    if (lastTaskDate) {
      if (lastTaskDate === today) {
        // Already completed task today, no change
        return { streak: appUser.currentStreak || 0, bonus: 0, continued: false };
      } else if (lastTaskDate === yesterdayStr) {
        // Continued streak
        newStreak = (appUser.currentStreak || 0) + 1;
      }
      // else streak broken, reset to 1
    }
    
    const longestStreak = Math.max(newStreak, appUser.longestStreak || 0);
    
    // Calculate streak bonus (points)
    const streakBonus = Math.min(newStreak * 10, 300); // Max 300 points
    
    await base44.entities.AppUser.update(userId, {
      currentStreak: newStreak,
      longestStreak,
      lastTaskDate: today,
      points: (appUser.points || 0) + streakBonus
    });
    
    return { streak: newStreak, bonus: streakBonus, continued: lastTaskDate === yesterdayStr };
  } catch (error) {
    console.error("Failed to update streak:", error);
    return { streak: 0, bonus: 0, continued: false };
  }
}

// Process lucky bonus for advanced tasks
export async function processLuckyBonus(userId, taskPrice) {
  // Only trigger for tasks >= $100
  if (taskPrice < 100) return null;

  // Random chance (50% for advanced tasks)
  if (Math.random() > 0.5) return null;

  try {
    const appUser = await base44.entities.AppUser.filter({ id: userId });
    if (!appUser[0]) return null;

    const user = appUser[0];

    // Check if user already received 3 bonuses in current set
    const currentSetBonuses = await base44.entities.Transaction.filter({
      userId: userId,
      type: "bonus",
      metadata: { taskSetBonus: true }
    });

    const bonusesInSet = currentSetBonuses.filter(b => {
      const bonusDate = new Date(b.created_date);
      const lastResetDate = user.lastResetDate ? new Date(user.lastResetDate) : new Date(0);
      return bonusDate > lastResetDate;
    });

    if (bonusesInSet.length >= 3) return null;

    // Calculate bonus based on task price
    let bonusAmount;
    if (taskPrice < 500) {
      bonusAmount = Math.floor(Math.random() * 1000);
    } else if (taskPrice < 5000) {
      bonusAmount = Math.floor(Math.random() * 4000) + 1000;
    } else if (taskPrice < 10000) {
      bonusAmount = Math.floor(Math.random() * 97500) + 2500;
    } else {
      bonusAmount = Math.floor(Math.random() * (taskPrice * 10 - 5000)) + 5000;
    }

    // Create bonus transaction
    const newBalance = (user.balance || 0) + bonusAmount;
    await base44.entities.Transaction.create({
      userId: userId,
      type: "bonus",
      amount: bonusAmount,
      status: "completed",
      metadata: { reason: "Lucky Bonus", taskSetBonus: true, taskPrice },
      balanceBefore: user.balance,
      balanceAfter: newBalance
    });

    // Update user balance
    await base44.entities.AppUser.update(userId, { balance: newBalance });

    return bonusAmount;
  } catch (error) {
    console.error("Failed to process lucky bonus:", error);
    return null;
  }
}