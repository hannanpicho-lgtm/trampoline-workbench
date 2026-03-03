import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { batchSize = 20 } = await req.json();

    // Get queued tasks with exponential backoff consideration
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

    // Filter tasks that are ready for retry (exponential backoff)
    const now = Date.now();
    const readyTasks = queuedTasks.filter(task => {
      if (!task.lastAttemptAt) return true;
      
      const retryCount = task.retryCount || 0;
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 300000); // Max 5 minutes
      const lastAttempt = new Date(task.lastAttemptAt).getTime();
      
      return (now - lastAttempt) >= backoffMs;
    });

    const tasksToProcess = readyTasks.slice(0, batchSize);
    const results = [];

    // Process tasks in parallel for better performance
    const processingPromises = tasksToProcess.map(async (queueItem) => {
      try {
        // Mark as processing
        await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
          status: "processing",
          lastAttemptAt: new Date().toISOString()
        });

        // Get user and check automation preferences
        const appUsers = await base44.asServiceRole.entities.AppUser.filter({ id: queueItem.userId });
        if (appUsers.length === 0) {
          throw new Error("User not found");
        }
        const appUser = appUsers[0];

        // Check automation rules
        const prefs = await base44.asServiceRole.entities.TaskAutomationPreference.filter({ userId: queueItem.userId });
        if (prefs.length > 0 && prefs[0].autoCompleteEnabled) {
          const rules = prefs[0].autoCompleteRules || {};
          
          // Check if task meets auto-completion criteria
          if (rules.excludePremium && queueItem.taskType === "premium") {
            throw new Error("Premium tasks excluded by user rules");
          }
          
          if (rules.minCommission && queueItem.commission < rules.minCommission) {
            throw new Error("Below minimum commission threshold");
          }
          
          if (rules.maxCommission && queueItem.commission > rules.maxCommission) {
            throw new Error("Above maximum commission threshold");
          }

          // Check pause hours
          if (rules.pauseHoursStart && rules.pauseHoursEnd) {
            const currentHour = new Date().getHours();
            const [startHour] = rules.pauseHoursStart.split(':').map(Number);
            const [endHour] = rules.pauseHoursEnd.split(':').map(Number);
            
            if (currentHour >= startHour && currentHour < endHour) {
              throw new Error("Auto-completion paused during quiet hours");
            }
          }
        }

        // Validate user can submit
        if (appUser.needsReset || appUser.tasksInCurrentSet >= 40) {
          throw new Error("User needs reset");
        }

        // Get product
        const products = await base44.asServiceRole.entities.Product.filter({ id: queueItem.productId });
        if (products.length === 0) {
          throw new Error("Product not found");
        }

        // Create task
        const newTask = await base44.asServiceRole.entities.UserTask.create({
          userId: queueItem.userId,
          productId: queueItem.productId,
          secondProductId: queueItem.secondProductId || null,
          isPremiumOrder: queueItem.taskType === "premium",
          commission: queueItem.commission,
          status: "completed",
          submittedAt: new Date().toISOString()
        });

        // Update user
        await base44.asServiceRole.entities.AppUser.update(queueItem.userId, {
          tasksCompleted: (appUser.tasksCompleted || 0) + 1,
          tasksInCurrentSet: (appUser.tasksInCurrentSet || 0) + 1,
          balance: (appUser.balance || 0) + queueItem.commission,
          points: (appUser.points || 0) + Math.floor(queueItem.commission * 10)
        });

        // Mark as completed
        await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
          status: "completed",
          completedAt: new Date().toISOString()
        });

        return {
          queueId: queueItem.id,
          userId: queueItem.userId,
          taskId: newTask.id,
          success: true,
          commission: queueItem.commission
        };

      } catch (error) {
        // Exponential backoff retry logic
        const newRetryCount = (queueItem.retryCount || 0) + 1;
        const maxRetries = queueItem.maxRetries || 3;

        if (newRetryCount >= maxRetries) {
          await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
            status: "failed",
            retryCount: newRetryCount,
            errorMessage: error.message,
            lastAttemptAt: new Date().toISOString()
          });
        } else {
          // Re-queue with updated retry count
          await base44.asServiceRole.entities.TaskQueue.update(queueItem.id, {
            status: "queued",
            retryCount: newRetryCount,
            errorMessage: error.message,
            lastAttemptAt: new Date().toISOString()
          });
        }

        return {
          queueId: queueItem.id,
          userId: queueItem.userId,
          success: false,
          error: error.message,
          retries: newRetryCount,
          nextRetryIn: Math.min(1000 * Math.pow(2, newRetryCount), 300000)
        };
      }
    });

    const processedResults = await Promise.allSettled(processingPromises);
    
    processedResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({ success: false, error: result.reason?.message || 'Unknown error' });
      }
    });

    return Response.json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      remaining: queuedTasks.length - tasksToProcess.length,
      waitingForBackoff: readyTasks.length - tasksToProcess.length,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});