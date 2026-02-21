import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all queued tasks ordered by priority (desc) and created_date (asc)
    const queuedTasks = await base44.asServiceRole.entities.TaskQueue.filter(
      { status: "queued" },
      "-priority"
    );

    if (queuedTasks.length === 0) {
      return Response.json({ 
        success: true, 
        message: "No tasks in queue",
        processed: 0 
      });
    }

    const results = [];
    const batchSize = 10; // Process 10 tasks at a time
    const tasksToProcess = queuedTasks.slice(0, batchSize);

    for (const queueItem of tasksToProcess) {
      try {
        // Mark as processing
        await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
          status: "processing",
          lastAttemptAt: new Date().toISOString()
        });

        // Get user data
        const appUsers = await base44.asServiceRole.entities.AppUser.filter({ id: queueItem.userId });
        if (appUsers.length === 0) {
          throw new Error("User not found");
        }
        const appUser = appUsers[0];

        // Check if user can submit tasks
        if (appUser.needsReset || appUser.tasksInCurrentSet >= 40) {
          throw new Error("User needs reset");
        }

        // Get product data
        const products = await base44.asServiceRole.entities.Product.filter({ id: queueItem.productId });
        if (products.length === 0) {
          throw new Error("Product not found");
        }
        const product = products[0];

        let secondProduct = null;
        if (queueItem.secondProductId) {
          const secondProducts = await base44.asServiceRole.entities.Product.filter({ id: queueItem.secondProductId });
          if (secondProducts.length > 0) {
            secondProduct = secondProducts[0];
          }
        }

        // Calculate commission
        const isPremium = queueItem.taskType === "premium";
        const baseCommission = isPremium && secondProduct 
          ? product.commission + secondProduct.commission
          : product.commission;
        const premiumMultiplier = isPremium ? 12 : 1;
        const totalCommission = baseCommission * premiumMultiplier;

        // Get VIP bonus
        const vipBonus = getVIPCommissionBonus(queueItem.vipLevel);
        const finalCommission = totalCommission * (1 + vipBonus / 100);

        // Create task
        const newTask = await base44.asServiceRole.entities.UserTask.create({
          userId: queueItem.userId,
          productId: queueItem.productId,
          secondProductId: queueItem.secondProductId || null,
          isPremiumOrder: isPremium,
          commission: finalCommission,
          status: "completed",
          submittedAt: new Date().toISOString()
        });

        // Update user
        const updatedTasksInSet = (appUser.tasksInCurrentSet || 0) + 1;
        const updatedTasksCompleted = (appUser.tasksCompleted || 0) + 1;
        
        await base44.asServiceRole.entities.AppUser.update(queueItem.userId, {
          tasksCompleted: updatedTasksCompleted,
          tasksInCurrentSet: updatedTasksInSet,
          balance: (appUser.balance || 0) + finalCommission,
          points: (appUser.points || 0) + Math.floor(finalCommission * 10)
        });

        // Mark queue item as completed
        await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
          status: "completed",
          completedAt: new Date().toISOString()
        });

        results.push({
          queueId: queueItem.id,
          userId: queueItem.userId,
          taskId: newTask.id,
          success: true,
          commission: finalCommission
        });

      } catch (error) {
        // Handle retry logic
        const newRetryCount = (queueItem.retryCount || 0) + 1;
        const maxRetries = queueItem.maxRetries || 3;

        if (newRetryCount >= maxRetries) {
          // Max retries reached, mark as failed
          await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
            status: "failed",
            retryCount: newRetryCount,
            errorMessage: error.message,
            lastAttemptAt: new Date().toISOString()
          });
        } else {
          // Queue for retry
          await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
            status: "queued",
            retryCount: newRetryCount,
            errorMessage: error.message,
            lastAttemptAt: new Date().toISOString()
          });
        }

        results.push({
          queueId: queueItem.id,
          userId: queueItem.userId,
          success: false,
          error: error.message,
          retries: newRetryCount
        });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      remaining: queuedTasks.length - tasksToProcess.length,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getVIPCommissionBonus(vipLevel) {
  const bonuses = {
    Bronze: 0,
    Silver: 5,
    Gold: 10,
    Platinum: 15,
    Diamond: 20
  };
  return bonuses[vipLevel] || 0;
}