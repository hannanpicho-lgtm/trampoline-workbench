import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";

/**
 * Task Queue Manager
 * Centralized system for managing task submissions
 */

const PRIORITY_LEVELS = {
  LOW: 0,
  NORMAL: 10,
  HIGH: 20,
  PREMIUM: 30,
  URGENT: 50
};

const VIP_PRIORITY_BOOST = {
  Bronze: 0,
  Silver: 5,
  Gold: 10,
  Platinum: 15,
  Diamond: 20
};

/**
 * Calculate task priority based on type and VIP level
 */
function calculatePriority(taskType, vipLevel) {
  let basePriority = PRIORITY_LEVELS.NORMAL;
  
  if (taskType === "premium") {
    basePriority = PRIORITY_LEVELS.PREMIUM;
  } else if (taskType === "advanced") {
    basePriority = PRIORITY_LEVELS.HIGH;
  }
  
  const vipBoost = VIP_PRIORITY_BOOST[vipLevel] || 0;
  return basePriority + vipBoost;
}

/**
 * Enqueue a task for processing
 */
export async function enqueueTask({ userId, taskType, productId, secondProductId, vipLevel, commission, metadata }) {
  try {
    const priority = calculatePriority(taskType, vipLevel);
    
    const queueItem = await backendClient.entities.TaskQueue.create({
      userId,
      taskType,
      productId,
      secondProductId: secondProductId || null,
      status: "queued",
      priority,
      vipLevel,
      commission,
      retryCount: 0,
      maxRetries: 3,
      metadata: metadata || {}
    });

    return {
      success: true,
      queueId: queueItem.id,
      position: await getQueuePosition(queueItem.id, priority)
    };
  } catch (error) {
    console.error("Failed to enqueue task:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get position in queue
 */
async function getQueuePosition(queueId, priority) {
  try {
    const queuedTasks = await backendClient.entities.TaskQueue.filter(
      { status: "queued" },
      "-priority"
    );
    
    const position = queuedTasks.findIndex(t => t.id === queueId);
    return position >= 0 ? position + 1 : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get queue status for a user
 */
export async function getUserQueueStatus(userId) {
  try {
    const userTasks = await backendClient.entities.TaskQueue.filter(
      { userId, status: "queued" },
      "-priority"
    );
    
    const processingTasks = await backendClient.entities.TaskQueue.filter(
      { userId, status: "processing" }
    );

    return {
      queued: userTasks.length,
      processing: processingTasks.length,
      tasks: userTasks
    };
  } catch (error) {
    console.error("Failed to get queue status:", error);
    return { queued: 0, processing: 0, tasks: [] };
  }
}

/**
 * Cancel a queued task
 */
export async function cancelQueuedTask(queueId) {
  try {
    const queueItem = await backendClient.entities.TaskQueue.filter({ id: queueId });
    
    if (queueItem.length === 0) {
      throw new Error("Queue item not found");
    }

    if (queueItem[0].status === "processing") {
      throw new Error("Cannot cancel task that is currently processing");
    }

    await backendClient.entities.TaskQueue.update(queueId, {
      status: "failed",
      errorMessage: "Cancelled by user"
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel task:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to queue updates for a user
 */
export function subscribeToQueue(userId, callback) {
  const unsubscribe = backendClient.entities.TaskQueue.subscribe((event) => {
    if (event.data?.userId === userId) {
      callback(event);
    }
  });

  return unsubscribe;
}

/**
 * Process queue (admin only - triggers backend function)
 */
export async function triggerQueueProcessing() {
  try {
    const response = await backendClient.functions.invoke('processTaskQueue', {});
    return response.data;
  } catch (error) {
    console.error("Failed to process queue:", error);
    throw error;
  }
}

/**
 * Get overall queue statistics
 */
export async function getQueueStatistics() {
  try {
    const [queued, processing, completed, failed] = await Promise.all([
      backendClient.entities.TaskQueue.filter({ status: "queued" }),
      backendClient.entities.TaskQueue.filter({ status: "processing" }),
      backendClient.entities.TaskQueue.filter({ status: "completed" }),
      backendClient.entities.TaskQueue.filter({ status: "failed" })
    ]);

    return {
      queued: queued.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
      total: queued.length + processing.length + completed.length + failed.length
    };
  } catch (error) {
    console.error("Failed to get queue stats:", error);
    return { queued: 0, processing: 0, completed: 0, failed: 0, total: 0 };
  }
}