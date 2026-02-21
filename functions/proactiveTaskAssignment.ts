import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all users who need task assignments
    const allUsers = await base44.asServiceRole.entities.AppUser.list();
    
    // Filter users who can receive new tasks
    const eligibleUsers = allUsers.filter(user => 
      !user.needsReset && 
      user.tasksInCurrentSet < 40 && 
      user.taskSetsCompleted < 2
    );

    if (eligibleUsers.length === 0) {
      return Response.json({ 
        success: true, 
        message: "No eligible users found",
        assigned: 0 
      });
    }

    // Get active task sets
    const taskSets = await base44.asServiceRole.entities.TaskSet.filter({ isActive: true });
    const taskSetsByVIP = {};
    taskSets.forEach(set => {
      if (!taskSetsByVIP[set.vipLevel]) {
        taskSetsByVIP[set.vipLevel] = [];
      }
      taskSetsByVIP[set.vipLevel].push(set);
    });

    // Sort by priority
    Object.keys(taskSetsByVIP).forEach(vip => {
      taskSetsByVIP[vip].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });

    // Get active products
    const products = await base44.asServiceRole.entities.Product.filter({ isActive: true });
    
    if (products.length === 0) {
      return Response.json({ 
        success: false, 
        message: "No active products available" 
      });
    }

    // VIP level task ranges and assignment quotas
    const vipConfig = {
      Bronze: { min: 0, max: 100, tasksToMaintain: 5 },
      Silver: { min: 50, max: 250, tasksToMaintain: 8 },
      Gold: { min: 150, max: 500, tasksToMaintain: 10 },
      Platinum: { min: 300, max: 1000, tasksToMaintain: 12 },
      Diamond: { min: 500, max: 10000, tasksToMaintain: 15 }
    };

    let totalAssigned = 0;
    const results = [];

    // Process each eligible user
    for (const user of eligibleUsers) {
      try {
        // Get user's existing tasks
        const userTasks = await base44.asServiceRole.entities.UserTask.filter({ userId: user.id });
        
        // Count available tasks (not completed/approved)
        const availableTasks = userTasks.filter(t => 
          t.status === "pending" || t.status === "completed"
        ).length;

        const config = vipConfig[user.vipLevel || 'Bronze'];
        const tasksNeeded = Math.max(0, config.tasksToMaintain - availableTasks);

        // Skip if user has enough tasks queued
        if (tasksNeeded === 0) {
          results.push({
            userId: user.id,
            vipLevel: user.vipLevel,
            status: 'sufficient',
            availableTasks,
            tasksNeeded: 0
          });
          continue;
        }

        // Try to use task set first
        const vipTaskSets = taskSetsByVIP[user.vipLevel || 'Bronze'] || [];
        let availableProducts = [];
        let fromTaskSet = false;

        if (vipTaskSets.length > 0) {
          const taskSet = vipTaskSets[0]; // Highest priority
          
          // Filter available products from task set
          const availableFromSet = taskSet.productIds.filter(productId => {
            return !userTasks.some(t => t.productId === productId);
          });

          if (availableFromSet.length > 0) {
            availableProducts = products.filter(p => availableFromSet.includes(p.id));
            fromTaskSet = true;
          }
        }

        // Fallback to general product pool if no task set available
        if (availableProducts.length === 0) {
          const range = config;
          availableProducts = products.filter(p => {
            const alreadyAssigned = userTasks.some(t => t.productId === p.id);
            return !alreadyAssigned && p.price >= range.min && p.price <= range.max;
          });
        }

        if (availableProducts.length === 0) {
          results.push({
            userId: user.id,
            vipLevel: user.vipLevel,
            status: 'no_products',
            availableTasks,
            tasksNeeded
          });
          continue;
        }

        // Calculate how many tasks to assign (don't exceed set limit)
        const numToAssign = Math.min(
          tasksNeeded,
          availableProducts.length,
          40 - user.tasksInCurrentSet
        );

        // Sort products by value for better task quality
        const sortedProducts = [...availableProducts].sort((a, b) => {
          const scoreA = a.price * a.commission;
          const scoreB = b.price * b.commission;
          return scoreB - scoreA;
        });

        // Assign top products
        const selectedProducts = sortedProducts.slice(0, numToAssign);
        let assigned = 0;

        for (const product of selectedProducts) {
          // Directly create the task (no offer system - auto-queue)
          const commission = product.commission;
          const vipBonus = getVIPCommissionBonus(user.vipLevel);
          const totalCommission = commission * (1 + vipBonus / 100);

          await base44.asServiceRole.entities.UserTask.create({
            userId: user.id,
            productId: product.id,
            commission: totalCommission,
            status: "pending",
            submittedAt: new Date().toISOString()
          });

          assigned++;
          totalAssigned++;
        }

        results.push({
          userId: user.id,
          vipLevel: user.vipLevel,
          status: 'assigned',
          availableTasks: availableTasks + assigned,
          tasksNeeded,
          tasksAssigned: assigned
        });

      } catch (error) {
        console.error(`Failed to assign tasks to user ${user.id}:`, error);
        results.push({
          userId: user.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: `Assigned ${totalAssigned} tasks to maintain queue levels`,
      usersProcessed: eligibleUsers.length,
      totalAssigned,
      results
    });

  } catch (error) {
    console.error("Proactive task assignment error:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

function getVIPCommissionBonus(vipLevel) {
  const bonuses = {
    Bronze: 0,
    Silver: 5,
    Gold: 12,
    Platinum: 25,
    Diamond: 40
  };
  return bonuses[vipLevel] || 0;
}