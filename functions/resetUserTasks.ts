import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, resetType = 'full' } = body;

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch user
    const appUsers = await base44.asServiceRole.entities.AppUser.filter({ id: userId });
    if (appUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const appUser = appUsers[0];

    // Determine reset type
    let updateData = {};

    if (resetType === 'full') {
      // Full reset: clear current set, don't increment (user completes set to trigger increment)
      updateData = {
        tasksInCurrentSet: 0,
        premiumEncounters: 0,
        needsReset: false
      };
    } else if (resetType === 'partial') {
      // Partial reset: just clear the "needs reset" flag
      updateData = {
        needsReset: false
      };
    } else if (resetType === 'custom') {
      // Custom reset: use provided values
      updateData = {
        tasksInCurrentSet: body.tasksInCurrentSet ?? 0,
        premiumEncounters: body.premiumEncounters ?? 0,
        taskSetsCompleted: body.taskSetsCompleted ?? appUser.taskSetsCompleted,
        needsReset: body.needsReset ?? false
      };
    }

    // Update user
    const updatedUser = await base44.asServiceRole.entities.AppUser.update(userId, updateData);

    // Automatically assign new tasks after reset
    if (resetType === 'full' || resetType === 'partial') {
      try {
        // VIP level configuration for task targets
        const vipTaskTargets = {
          Bronze: { min: 0, max: 100, tasksToAssign: 10 },
          Silver: { min: 50, max: 3499, tasksToAssign: 12 },
          Gold: { min: 3500, max: 5499, tasksToAssign: 15 },
          Platinum: { min: 5500, max: 9999, tasksToAssign: 18 },
          Diamond: { min: 10000, max: Infinity, tasksToAssign: 20 }
        };

        const vipLevel = updatedUser.vipLevel || 'Bronze';
        const config = vipTaskTargets[vipLevel];

        // Get all active products
        const products = await base44.asServiceRole.entities.Product.filter({ isActive: true });

        // Get user's existing tasks
        const existingTasks = await base44.asServiceRole.entities.UserTask.filter({ userId: userId });
        const completedProductIds = existingTasks
          .filter(t => t.status === 'completed' || t.status === 'approved')
          .map(t => t.productId);

        // Delete all pending tasks first to start fresh
        const pendingTasks = existingTasks.filter(t => t.status === 'pending');
        for (const task of pendingTasks) {
          await base44.asServiceRole.entities.UserTask.delete(task.id);
        }

        // Filter products by VIP level and not completed
        let availableProducts = products.filter(p => 
          !completedProductIds.includes(p.id) &&
          p.price >= config.min && 
          p.price <= config.max
        );

        // CRITICAL: Premium products only allowed in Set 2
        const currentTaskSet = updatedUser.taskSetsCompleted + 1;
        if (currentTaskSet === 1) {
          availableProducts = availableProducts.filter(p => !p.isPremium);
          console.log(`Filtering out premium products for Set 1`);
        }

        // Limit premium products based on encounter count
        const maxPremium = updatedUser.maxPremiumPerSet || 3;
        const premiumCount = updatedUser.premiumEncounters || 0;
        const premiumProductsInPool = availableProducts.filter(p => p.isPremium);
        const remainingPremiumSlots = Math.max(0, maxPremium - premiumCount);

        if (premiumProductsInPool.length > remainingPremiumSlots) {
          // Limit premium products to remaining slots
          const regularProducts = availableProducts.filter(p => !p.isPremium);
          const limitedPremium = premiumProductsInPool.slice(0, remainingPremiumSlots);
          availableProducts = [...regularProducts, ...limitedPremium];
          console.log(`Limited premium products: ${remainingPremiumSlots} slots available`);
        }

        if (availableProducts.length === 0) {
          throw new Error(`No available products for ${vipLevel} level`);
        }

        // For Bronze, validate commission range
        if (vipLevel === 'Bronze') {
          availableProducts = availableProducts.filter(p => p.price <= 100);
          
          if (availableProducts.length < config.tasksToAssign) {
            throw new Error(`Not enough VIP1-valid products (≤$100). Available: ${availableProducts.length}, Needed: ${config.tasksToAssign}`);
          }

          // Try to find combination with reasonable total commission
          let selectedProducts = null;
          let attempts = 0;
          const maxAttempts = 50;

          while (!selectedProducts && attempts < maxAttempts) {
            const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
            const candidates = shuffled.slice(0, config.tasksToAssign);
            const totalCommission = candidates.reduce((sum, p) => sum + p.commission, 0);

            // More flexible range for initial batch
            if (totalCommission >= 30 && totalCommission <= 60) {
              selectedProducts = candidates;
              console.log(`VIP1 validation passed - Total commission: ${totalCommission.toFixed(2)}`);
            }
            attempts++;
          }

          if (!selectedProducts) {
            // Fallback: just take the first N products
            selectedProducts = availableProducts.slice(0, config.tasksToAssign);
            console.log(`VIP1 using fallback selection`);
          }

          availableProducts = selectedProducts;
        } else {
          // Other VIP levels - simple random selection
          const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
          availableProducts = shuffled.slice(0, config.tasksToAssign);
        }

        // Use intelligent product selector
        const currentSetNumber = updatedUser.taskSetsCompleted + 1;
        const selectionResult = await base44.asServiceRole.functions.invoke('intelligentProductSelector', {
          vipLevel: vipLevel,
          setNumber: currentSetNumber,
          userId: userId
        });

        if (!selectionResult.data.success) {
          throw new Error('Product selection failed: ' + selectionResult.data.error);
        }

        const selectedProducts = selectionResult.data.products;

        // Assign tasks
        let assignedCount = 0;
        for (const product of selectedProducts) {
          await base44.asServiceRole.entities.UserTask.create({
            userId: userId,
            productId: product.id,
            commission: product.commission,
            status: 'pending'
          });
          assignedCount++;
        }

        console.log(`✅ Intelligent assignment: ${assignedCount} tasks, Total commission: $${selectionResult.data.actualCommission.toFixed(2)} (Target: $${selectionResult.data.targetRange.min}-$${selectionResult.data.targetRange.max})`);

        console.log(`✅ Reset complete. Assigned ${assignedCount} tasks to ${vipLevel} user ${userId}`);
      } catch (error) {
        console.error('❌ Error assigning products after reset:', error);
        // Don't throw - allow reset to complete even if task assignment fails
        console.log('Reset completed but task assignment failed. Tasks can be assigned via automation.');
      }
    }

    // Create reset log entry
    await base44.asServiceRole.entities.CustomerServiceChat.create({
      userId: userId,
      message: `[ADMIN RESET] Task reset applied by admin. Type: ${resetType}. Previous set: ${appUser.taskSetsCompleted}, Tasks in set: ${appUser.tasksInCurrentSet}. New state: Sets completed: ${updateData.taskSetsCompleted}, Tasks in set: ${updateData.tasksInCurrentSet}. Products automatically refreshed and available.`,
      isFromUser: false,
      status: 'resolved'
    });

    return Response.json({
      success: true,
      message: `User tasks reset successfully (${resetType})`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Task reset error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});