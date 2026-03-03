import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get all segments and users
    const [segments, users, notifications] = await Promise.all([
      base44.asServiceRole.entities.UserSegment.filter({ isActive: true }),
      base44.asServiceRole.entities.AppUser.list('-created_date', 1000),
      base44.asServiceRole.entities.Notification.list('-created_date', 1000)
    ]);

    const today = new Date().toISOString().split('T')[0];

    for (const segment of segments) {
      const criteria = segment.criteria;
      
      // Filter users matching segment criteria
      const segmentUsers = users.filter(user => {
        if (criteria.vipLevels?.length > 0 && !criteria.vipLevels.includes(user.vipLevel)) return false;
        if (criteria.minBalance != null && (user.balance || 0) < criteria.minBalance) return false;
        if (criteria.maxBalance != null && (user.balance || 0) > criteria.maxBalance) return false;
        if (criteria.minTasks != null && (user.tasksCompleted || 0) < criteria.minTasks) return false;
        if (criteria.maxTasks != null && (user.tasksCompleted || 0) > criteria.maxTasks) return false;
        if (criteria.accountStatus === 'active' && user.isDeactivated) return false;
        if (criteria.accountStatus === 'deactivated' && !user.isDeactivated) return false;
        if (criteria.accountStatus === 'frozen' && !user.isFrozen) return false;
        return true;
      });

      const activeUsers = segmentUsers.filter(u => {
        if (!u.lastLogin) return false;
        const days = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
        return days <= 7;
      }).length;

      const totalBalance = segmentUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
      const totalTasks = segmentUsers.reduce((sum, u) => sum + (u.tasksCompleted || 0), 0);
      const avgBalance = segmentUsers.length > 0 ? totalBalance / segmentUsers.length : 0;
      const avgTasks = segmentUsers.length > 0 ? totalTasks / segmentUsers.length : 0;

      const segmentNotifications = notifications.filter(n => 
        segmentUsers.some(u => u.id === n.userId)
      );
      const notificationsSent = segmentNotifications.length;
      const notificationsRead = segmentNotifications.filter(n => n.read).length;
      const engagementRate = notificationsSent > 0 
        ? (notificationsRead / notificationsSent) * 100 
        : 0;

      // Create or update analytics record
      const existingAnalytics = await base44.asServiceRole.entities.SegmentAnalytics.filter({
        segmentId: segment.id,
        date: today
      });

      const analyticsData = {
        segmentId: segment.id,
        date: today,
        userCount: segmentUsers.length,
        activeUsers,
        totalBalance,
        totalTasks,
        avgBalance,
        avgTasks,
        notificationsSent,
        notificationsRead,
        engagementRate
      };

      if (existingAnalytics.length > 0) {
        await base44.asServiceRole.entities.SegmentAnalytics.update(
          existingAnalytics[0].id,
          analyticsData
        );
      } else {
        await base44.asServiceRole.entities.SegmentAnalytics.create(analyticsData);
      }

      // Update segment user count
      await base44.asServiceRole.entities.UserSegment.update(segment.id, {
        userCount: segmentUsers.length,
        lastCalculated: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      segmentsProcessed: segments.length,
      message: 'Analytics calculated successfully'
    });

  } catch (error) {
    console.error('Calculate segment analytics error:', error);
    return Response.json(
      { error: error.message || 'Failed to calculate analytics' },
      { status: 500 }
    );
  }
});