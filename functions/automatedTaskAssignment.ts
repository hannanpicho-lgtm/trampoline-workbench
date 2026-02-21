import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Load active configurations
    const configs = await base44.asServiceRole.entities.TaskAssignmentConfig.filter({ isActive: true });
    
    if (configs.length === 0) {
      return Response.json({ 
        error: 'No active configurations found',
        usersAssigned: 0,
        tasksAssigned: 0
      });
    }

    let totalUsersAssigned = 0;
    let totalTasksAssigned = 0;
    let expiredReassigned = 0;
    let rejectedReassigned = 0;

    // Process each VIP level configuration
    for (const config of configs) {
      // 1. Handle expired tasks reassignment
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - config.taskExpirationHours);

      const expiredTasks = await base44.asServiceRole.entities.UserTask.filter({
        status: 'pending',
        created_date: { $lt: expirationDate.toISOString() }
      });

      for (const task of expiredTasks) {
        await base44.asServiceRole.entities.UserTask.update(task.id, {
          status: 'expired'
        });
        expiredReassigned++;
      }

      // 2. Handle rejected task reassignment
      if (config.autoReassignOnRejection) {
        const rejectedTasks = await base44.asServiceRole.entities.UserTask.filter({
          status: 'rejected'
        });

        // Mark rejected tasks for potential reassignment
        rejectedReassigned += rejectedTasks.length;
      }

      // 3. Get eligible users for this VIP level
      const allUsers = await base44.asServiceRole.entities.AppUser.filter({
        vipLevel: config.vipLevel,
        needsReset: false,
        isFrozen: false
      });

      // Filter users based on balance requirements if enabled
      let eligibleUsers = allUsers;
      if (config.balanceBasedAssignment) {
        const balanceRequirements = {
          "Bronze": { min: 100 },
          "Silver": { min: 500 },
          "Gold": { min: 3500 },
          "Platinum": { min: 5500 },
          "Diamond": { min: 10000 }
        };
        const requirement = balanceRequirements[config.vipLevel];
        eligibleUsers = allUsers.filter(u => (u.balance || 0) >= requirement.min);
      }

      // Prioritize active users (recent activity)
      if (config.prioritizeActiveUsers) {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);
        eligibleUsers = eligibleUsers.sort((a, b) => {
          const aRecent = new Date(a.lastTaskDate || a.created_date) > recentDate;
          const bRecent = new Date(b.lastTaskDate || b.created_date) > recentDate;
          return bRecent - aRecent;
        });
      }

      // Get available products for this VIP level
      const products = await base44.asServiceRole.entities.Product.filter({ 
        isActive: true 
      });

      // 4. Assign tasks to eligible users
      for (const appUser of eligibleUsers) {
        // Check current pending tasks
        const pendingTasks = await base44.asServiceRole.entities.UserTask.filter({
          userId: appUser.id,
          status: 'pending'
        });

        if (pendingTasks.length >= config.maxPendingTasks) {
          continue; // User already has max pending tasks
        }

        // Calculate how many tasks to assign
        const capacity = Math.floor(config.tasksPerAssignment * config.userCapacityMultiplier);
        const tasksToAssign = Math.min(
          capacity,
          config.maxPendingTasks - pendingTasks.length
        );

        if (tasksToAssign <= 0) continue;

        // Get user's completed task product IDs to avoid duplicates
        const completedTasks = await base44.asServiceRole.entities.UserTask.filter({
          userId: appUser.id,
          status: { $in: ['completed', 'approved'] }
        });
        const completedProductIds = completedTasks.map(t => t.productId);

        // Filter available products
        let availableProducts = products.filter(p => 
          !pendingTasks.some(t => t.productId === p.id) &&
          !completedProductIds.includes(p.id)
        );

        // No premium products in Set 1
        const currentSet = (appUser.taskSetsCompleted || 0) + 1;
        if (currentSet === 1) {
          availableProducts = availableProducts.filter(p => !p.isPremium);
        }

        if (availableProducts.length === 0) continue;

        // Randomly select products
        const selectedProducts = [];
        for (let i = 0; i < tasksToAssign && availableProducts.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableProducts.length);
          selectedProducts.push(availableProducts[randomIndex]);
          availableProducts.splice(randomIndex, 1);
        }

        // Create task assignments
        const vipCommissionRates = {
          "Bronze": 0.005,
          "Silver": 0.01,
          "Gold": 0.015,
          "Platinum": 0.02,
          "Diamond": 0.025
        };
        const commissionRate = vipCommissionRates[config.vipLevel] || 0.005;

        for (const product of selectedProducts) {
          const commission = product.isPremium 
            ? product.price * commissionRate * 10
            : product.price * commissionRate;

          await base44.asServiceRole.entities.UserTask.create({
            userId: appUser.id,
            productId: product.id,
            commission,
            status: 'pending'
          });

          totalTasksAssigned++;
        }

        totalUsersAssigned++;
      }
    }

    return Response.json({
      success: true,
      usersAssigned: totalUsersAssigned,
      tasksAssigned: totalTasksAssigned,
      expiredReassigned,
      rejectedReassigned,
      message: `Successfully assigned ${totalTasksAssigned} tasks to ${totalUsersAssigned} users`
    });

  } catch (error) {
    console.error('Automated assignment error:', error);
    return Response.json({ 
      error: error.message,
      usersAssigned: 0,
      tasksAssigned: 0
    }, { status: 500 });
  }
});