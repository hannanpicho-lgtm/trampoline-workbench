import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { assignmentLimit = 100, includeInactive = false } = payload;

    // Fetch all active users
    const allUsers = await base44.asServiceRole.entities.AppUser.list('-created_date', 1000);
    const users = includeInactive ? allUsers : allUsers.filter(u => !u.isDeactivated);

    // VIP multipliers for task capacity and rewards
    const vipMultipliers = {
      'Bronze': { capacity: 1.0, taskComplexityMin: 0, taskComplexityMax: 100 },
      'Silver': { capacity: 1.2, taskComplexityMin: 20, taskComplexityMax: 100 },
      'Gold': { capacity: 1.5, taskComplexityMin: 40, taskComplexityMax: 100 },
      'Platinum': { capacity: 1.8, taskComplexityMin: 60, taskComplexityMax: 100 },
      'Diamond': { capacity: 2.0, taskComplexityMin: 70, taskComplexityMax: 100 }
    };

    // Get task configuration for each VIP level
    const configs = await base44.asServiceRole.entities.TaskAssignmentConfig.list();
    const configMap = {};
    configs.forEach(cfg => {
      configMap[cfg.vipLevel] = cfg;
    });

    // Get available products/tasks
    const products = await base44.asServiceRole.entities.Product.filter({ isActive: true });

    // Get existing pending tasks
    const existingTasks = await base44.asServiceRole.entities.UserTask.filter({ status: 'pending' });

    // Calculate assignments
    const assignments = [];
    let assignedCount = 0;

    for (const appUser of users) {
      if (assignedCount >= assignmentLimit) break;

      // Skip if user needs reset or is frozen
      if (appUser.needsReset || appUser.isFrozen) continue;

      // Skip if user already has max pending tasks
      const userPendingCount = existingTasks.filter(t => t.userId === appUser.id).length;
      const vipLevel = appUser.vipLevel || 'Bronze';
      const config = configMap[vipLevel];
      const maxPending = config?.maxPendingTasks || 10;

      if (userPendingCount >= maxPending) continue;

      // Calculate completion rate
      const completionRate = appUser.tasksCompleted > 0 
        ? Math.min(100, (appUser.successRate || 100)) 
        : 100;

      // Calculate tasks to assign based on:
      // 1. VIP level capacity multiplier
      // 2. User's current completion rate
      // 3. Current pending task count
      const multiplier = vipMultipliers[vipLevel];
      const baseCapacity = 5; // Default 5 tasks per assignment
      const capacityAdjustment = multiplier.capacity;
      const completionAdjustment = completionRate / 100; // Reduce if low completion rate
      const pendingAdjustment = Math.max(0.5, 1 - (userPendingCount / maxPending)); // Reduce if many pending

      const tasksToAssign = Math.ceil(
        baseCapacity * capacityAdjustment * completionAdjustment * pendingAdjustment
      );

      if (tasksToAssign === 0) continue;

      // Filter products based on VIP level complexity
      const eligibleProducts = products.filter(p => {
        if (p.isPremium && appUser.taskSetsCompleted < 1) return false; // Premium only in set 2
        return !existingTasks.some(t => t.userId === appUser.id && t.productId === p.id);
      });

      if (eligibleProducts.length === 0) continue;

      // Assign tasks
      for (let i = 0; i < tasksToAssign && assignedCount < assignmentLimit; i++) {
        const randomProduct = eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];
        
        assignments.push({
          userId: appUser.id,
          productId: randomProduct.id,
          vipLevel: vipLevel,
          completionRate: completionRate,
          assignmentReason: `Auto-assigned based on ${vipLevel} level and ${completionRate}% completion rate`
        });

        assignedCount++;
      }
    }

    // Create assigned tasks in batch
    if (assignments.length > 0) {
      const taskCreatePayload = assignments.map(a => ({
        userId: a.userId,
        productId: a.productId,
        commission: 0, // Will be calculated on submission
        status: 'pending'
      }));

      await base44.asServiceRole.entities.UserTask.bulkCreate(taskCreatePayload);
    }

    // Log assignment statistics
    const stats = {
      totalAssigned: assignedCount,
      byVIP: {}
    };

    assignments.forEach(a => {
      stats.byVIP[a.vipLevel] = (stats.byVIP[a.vipLevel] || 0) + 1;
    });

    return Response.json({
      success: true,
      assigned: assignedCount,
      assignments: assignments,
      statistics: stats
    });
  } catch (error) {
    console.error('Task assignment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});