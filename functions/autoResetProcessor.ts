import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { ruleId, manualTrigger } = body;

    // Get rules to process
    let rules = [];
    if (ruleId) {
      const rule = await base44.asServiceRole.entities.AutoResetRule.filter({ id: ruleId });
      rules = rule.filter(r => r.isActive);
    } else {
      rules = await base44.asServiceRole.entities.AutoResetRule.filter({ isActive: true });
    }

    if (rules.length === 0) {
      return Response.json({ message: 'No active rules to process', affectedUsers: 0 });
    }

    let totalAffected = 0;

    for (const rule of rules) {
      const affectedUsers = await processRule(base44, rule, manualTrigger);
      totalAffected += affectedUsers;

      // Update rule stats
      await base44.asServiceRole.entities.AutoResetRule.update(rule.id, {
        lastProcessed: new Date().toISOString(),
        usersAffected: (rule.usersAffected || 0) + affectedUsers
      });
    }

    return Response.json({
      success: true,
      rulesProcessed: rules.length,
      affectedUsers: totalAffected
    });
  } catch (error) {
    console.error('Auto-reset processor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processRule(base44, rule, manualTrigger) {
  const allUsers = await base44.asServiceRole.entities.AppUser.list();
  let affectedCount = 0;

  for (const appUser of allUsers) {
    // Check if user meets rule criteria
    const shouldReset = await checkRuleCriteria(base44, rule, appUser, manualTrigger);
    
    if (shouldReset) {
      await performReset(base44, appUser, rule);
      affectedCount++;
    }
  }

  return affectedCount;
}

async function checkRuleCriteria(base44, rule, appUser, manualTrigger) {
  // Skip if user doesn't match VIP level filter
  if (rule.vipLevels && rule.vipLevels.length > 0) {
    if (!rule.vipLevels.includes(appUser.vipLevel || 'Bronze')) {
      return false;
    }
  }

  // Skip frozen or already needing reset users
  if (appUser.isFrozen && rule.triggerType !== 'task_sets_completed') {
    return false;
  }

  switch (rule.triggerType) {
    case 'task_sets_completed':
      // Reset if user completed X sets and needs reset
      return appUser.taskSetsCompleted >= rule.triggerValue && appUser.needsReset;

    case 'inactivity_period':
      // Reset if user hasn't completed tasks in X days
      if (!appUser.lastTaskDate) return false;
      const daysSinceLastTask = Math.floor(
        (Date.now() - new Date(appUser.lastTaskDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Send warning 1 day before reset
      if (rule.sendWarning && daysSinceLastTask === rule.triggerValue - 1) {
        await sendWarningNotification(base44, appUser, rule);
        return false;
      }
      
      return daysSinceLastTask >= rule.triggerValue;

    case 'credit_score_drop':
      // Reset if credit score drops below threshold
      return (appUser.creditScore || 100) < rule.triggerValue;

    case 'completion_rate_low':
      // Reset if completion rate is below threshold
      const successRate = appUser.successRate || 100;
      return successRate < rule.triggerValue;

    case 'stuck_in_set':
      // Reset if stuck in a set for too long with some progress
      const tasksInSet = appUser.tasksInCurrentSet || 0;
      if (tasksInSet === 0 || tasksInSet >= 40) return false;
      
      if (!appUser.lastTaskDate) return false;
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(appUser.lastTaskDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceActivity >= rule.triggerValue;

    default:
      return false;
  }
}

async function sendWarningNotification(base44, appUser, rule) {
  try {
    await base44.asServiceRole.entities.Notification.create({
      userId: appUser.id,
      type: 'system',
      title: 'Activity Reminder',
      message: `You haven't completed tasks in ${rule.triggerValue - 1} days. Complete a task soon to avoid an automatic reset.`,
      priority: 'medium'
    });

    await base44.asServiceRole.entities.CustomerServiceChat.create({
      userId: appUser.id,
      message: `⏰ Reminder: You haven't completed tasks recently. To keep your progress active, please submit at least one task within the next 24 hours. Need help? Contact us anytime!`,
      isFromUser: false,
      status: 'replied',
      metadata: { isProactive: true, issueType: 'inactivity_warning' }
    });

    // Update warning count
    await base44.asServiceRole.entities.AutoResetRule.update(rule.id, {
      warningsSent: (rule.warningsSent || 0) + 1
    });
  } catch (error) {
    console.error('Failed to send warning:', error);
  }
}

async function performReset(base44, appUser, rule) {
  try {
    // Call the existing reset function
    await base44.asServiceRole.functions.invoke('resetUserTasks', {
      userId: appUser.id,
      resetType: rule.resetType
    });

    // Auto-assign tasks if enabled
    if (rule.autoAssignTasks) {
      await base44.asServiceRole.functions.invoke('intelligentTaskAssignment', {
        userId: appUser.id,
        mode: 'auto'
      });
    }

    // Send notification if enabled
    if (rule.sendNotification) {
      const messages = {
        task_sets_completed: `🎉 Congratulations on completing your task set! Your account has been reset and new tasks are ready.`,
        inactivity_period: `🔄 Your tasks have been automatically reset due to inactivity. Fresh tasks are now available for you!`,
        credit_score_drop: `📊 Your tasks have been reset to help improve your performance. New opportunities are waiting!`,
        completion_rate_low: `💪 We've refreshed your tasks to give you new opportunities to succeed. You've got this!`,
        stuck_in_set: `🚀 Your task set has been reset to help you make progress. New tasks are ready to go!`
      };

      await base44.asServiceRole.entities.Notification.create({
        userId: appUser.id,
        type: 'system',
        title: 'Tasks Reset - New Tasks Available',
        message: messages[rule.triggerType] || `Your tasks have been reset. Reason: ${rule.ruleName}`,
        priority: 'medium'
      });

      await base44.asServiceRole.entities.CustomerServiceChat.create({
        userId: appUser.id,
        message: messages[rule.triggerType] || `Your tasks have been automatically reset: ${rule.ruleName}`,
        isFromUser: false,
        status: 'replied',
        metadata: { 
          isProactive: true, 
          issueType: 'auto_reset',
          ruleId: rule.id,
          resetType: rule.resetType
        }
      });
    }

    // Notify support team if enabled
    if (rule.notifySupport) {
      await base44.asServiceRole.entities.Notification.create({
        userId: 'admin',
        type: 'system',
        title: 'Auto-Reset Performed',
        message: `User ${appUser.created_by} was automatically reset by rule: ${rule.ruleName}`,
        priority: 'low',
        relatedId: appUser.id,
        relatedType: 'AppUser'
      });
    }
  } catch (error) {
    console.error(`Failed to reset user ${appUser.id}:`, error);
  }
}