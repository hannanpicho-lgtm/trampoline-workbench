import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = Date.now();
    const issues = [];

    // Get all users
    const allUsers = await base44.asServiceRole.entities.AppUser.list();
    
    for (const appUser of allUsers) {
      const userId = appUser.id;
      const userEmail = appUser.created_by;

      // Issue 1: Task set completed but no activity for 24+ hours
      if (appUser.needsReset && appUser.lastLogin) {
        const hoursSinceLogin = (now - new Date(appUser.lastLogin).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLogin > 24) {
          issues.push({
            userId,
            userEmail,
            type: 'inactive_after_completion',
            severity: 'medium',
            message: `User completed task set but hasn't logged in for ${Math.floor(hoursSinceLogin)} hours`
          });

          // Send proactive message
          await base44.asServiceRole.entities.CustomerServiceChat.create({
            userId,
            message: "👋 Hi! We noticed you completed your task set. Contact us anytime to unlock your next set of tasks. We're here to help!",
            isFromUser: false,
            status: 'replied',
            metadata: { isProactive: true, issueType: 'inactive_after_completion' }
          });
        }
      }

      // Issue 2: Balance below VIP threshold
      const currentBalance = appUser.balance || 0;
      const vipLevel = appUser.vipLevel || "Bronze";
      const thresholds = {
        "Bronze": 100,
        "Silver": 500,
        "Gold": 3500,
        "Platinum": 5500,
        "Diamond": 10000
      };

      if (currentBalance < thresholds[vipLevel] && currentBalance > 0) {
        issues.push({
          userId,
          userEmail,
          type: 'balance_below_threshold',
          severity: 'high',
          message: `${vipLevel} user balance ($${currentBalance}) below threshold ($${thresholds[vipLevel]})`
        });

        // Send proactive message
        await base44.asServiceRole.entities.CustomerServiceChat.create({
          userId,
          message: `⚠️ Your balance ($${currentBalance}) is below the required minimum for ${vipLevel} level ($${thresholds[vipLevel]}). Please deposit to continue submitting tasks or contact us for assistance.`,
          isFromUser: false,
          status: 'replied',
          metadata: { isProactive: true, issueType: 'balance_below_threshold' }
        });
      }

      // Issue 3: Account frozen for 48+ hours
      if (appUser.isFrozen) {
        const tasks = await base44.asServiceRole.entities.UserTask.filter({ userId, status: 'completed' });
        const latestTask = tasks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
        
        if (latestTask?.submittedAt) {
          const hoursFrozen = (now - new Date(latestTask.submittedAt).getTime()) / (1000 * 60 * 60);
          if (hoursFrozen > 48) {
            issues.push({
              userId,
              userEmail,
              type: 'frozen_too_long',
              severity: 'critical',
              message: `Account frozen for ${Math.floor(hoursFrozen)} hours`
            });

            await base44.asServiceRole.entities.CustomerServiceChat.create({
              userId,
              message: "🔒 Your account has been frozen for over 48 hours. Please contact customer support immediately to resolve this issue.",
              isFromUser: false,
              status: 'replied',
              metadata: { isProactive: true, issueType: 'frozen_too_long' }
            });
          }
        }
      }

      // Issue 4: Low credit score
      if (appUser.creditScore < 60) {
        issues.push({
          userId,
          userEmail,
          type: 'low_credit_score',
          severity: 'medium',
          message: `Credit score: ${appUser.creditScore}%`
        });

        await base44.asServiceRole.entities.CustomerServiceChat.create({
          userId,
          message: `📊 Your credit score is ${appUser.creditScore}%. Complete tasks successfully to improve your score and unlock more opportunities!`,
          isFromUser: false,
          status: 'replied',
          metadata: { isProactive: true, issueType: 'low_credit_score' }
        });
      }

      // Issue 5: Stuck in current set for 7+ days
      if (appUser.tasksInCurrentSet > 0 && appUser.tasksInCurrentSet < 40 && appUser.lastLogin) {
        const daysSinceLogin = (now - new Date(appUser.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLogin > 7) {
          issues.push({
            userId,
            userEmail,
            type: 'stuck_in_set',
            severity: 'medium',
            message: `${appUser.tasksInCurrentSet} tasks completed, no activity for ${Math.floor(daysSinceLogin)} days`
          });

          await base44.asServiceRole.entities.CustomerServiceChat.create({
            userId,
            message: `💪 You have ${appUser.tasksInCurrentSet} tasks completed! Keep going to finish your set. Need help? We're here for you!`,
            isFromUser: false,
            status: 'replied',
            metadata: { isProactive: true, issueType: 'stuck_in_set' }
          });
        }
      }
    }

    // Create admin notifications for critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    for (const issue of criticalIssues) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        userId: 'admin',
        type: 'system',
        title: 'Critical User Issue Detected',
        message: `${issue.userEmail}: ${issue.message}`,
        priority: 'high',
        relatedId: issue.userId,
        relatedType: 'AppUser'
      });
    }

    return Response.json({
      success: true,
      issuesDetected: issues.length,
      breakdown: {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length
      },
      issues
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});