import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action, reason, userId, targetLevel, ruleId, autoUpgrade } = body;

    // Handle admin approval/rejection
    if (requestId && action) {
      if (user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      const request = await base44.asServiceRole.entities.VIPUpgradeRequest.get(requestId);
      const appUser = await base44.asServiceRole.entities.AppUser.get(request.userId);
      
      if (action === 'approve') {
        // Get the rule to check for upgrade fee
        const rules = await base44.asServiceRole.entities.VIPUpgradeRule.filter({
          fromLevel: request.currentLevel,
          toLevel: request.requestedLevel,
          isActive: true
        });

        const rule = rules[0];
        let newBalance = appUser.balance;

        if (rule?.upgradeFee > 0) {
          if (appUser.balance < rule.upgradeFee) {
            return Response.json({ 
              error: 'Insufficient balance for upgrade fee' 
            }, { status: 400 });
          }
          newBalance -= rule.upgradeFee;
        }

        // Update user VIP level
        await base44.asServiceRole.entities.AppUser.update(appUser.id, {
          vipLevel: request.requestedLevel,
          balance: newBalance
        });

        // Update request
        await base44.asServiceRole.entities.VIPUpgradeRequest.update(requestId, {
          status: 'approved',
          reviewedBy: user.email,
          reviewNotes: reason || 'Approved'
        });

        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          userId: appUser.id,
          type: 'system',
          title: '🎉 VIP Upgrade Approved!',
          message: `Congratulations! You've been upgraded to ${request.requestedLevel}.`,
          priority: 'high'
        });

        return Response.json({ 
          success: true, 
          message: 'Upgrade approved',
          newLevel: request.requestedLevel 
        });

      } else if (action === 'reject') {
        await base44.asServiceRole.entities.VIPUpgradeRequest.update(requestId, {
          status: 'rejected',
          reviewedBy: user.email,
          reviewNotes: reason || 'Rejected'
        });

        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          userId: request.userId,
          type: 'system',
          title: 'VIP Upgrade Request',
          message: `Your upgrade request was not approved. ${reason || ''}`,
          priority: 'medium'
        });

        return Response.json({ success: true, message: 'Request rejected' });
      }
    }

    // Handle auto-upgrade
    if (autoUpgrade && userId && targetLevel && ruleId) {
      const appUser = await base44.asServiceRole.entities.AppUser.get(userId);
      const rule = await base44.asServiceRole.entities.VIPUpgradeRule.get(ruleId);

      // Verify requirements are met
      let canUpgrade = false;
      if (rule.requirementType === 'balance') {
        canUpgrade = appUser.balance >= rule.minBalance;
      } else if (rule.requirementType === 'tasks_completed') {
        canUpgrade = appUser.tasksCompleted >= rule.minTasksCompleted;
      } else if (rule.requirementType === 'both') {
        canUpgrade = appUser.balance >= rule.minBalance && 
                     appUser.tasksCompleted >= rule.minTasksCompleted;
      }

      if (!canUpgrade) {
        return Response.json({ 
          error: 'Requirements not met' 
        }, { status: 400 });
      }

      let newBalance = appUser.balance;
      if (rule.upgradeFee > 0) {
        if (appUser.balance < rule.upgradeFee) {
          return Response.json({ 
            error: 'Insufficient balance for upgrade fee' 
          }, { status: 400 });
        }
        newBalance -= rule.upgradeFee;
      }

      // Perform upgrade
      await base44.asServiceRole.entities.AppUser.update(userId, {
        vipLevel: targetLevel,
        balance: newBalance
      });

      // Send notification
      await base44.asServiceRole.entities.Notification.create({
        userId: userId,
        type: 'system',
        title: '🎉 VIP Level Upgraded!',
        message: `Congratulations! You've been automatically upgraded to ${targetLevel}.`,
        priority: 'high'
      });

      return Response.json({ 
        success: true, 
        message: 'Auto-upgrade successful',
        newLevel: targetLevel 
      });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('VIP upgrade error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});