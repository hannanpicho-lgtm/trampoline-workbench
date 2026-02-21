import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user app data
    const appUsers = await base44.entities.AppUser.filter({ created_by: user.email });
    if (appUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const appUser = appUsers[0];
    const userId = appUser.id;

    // Get all badges
    const allBadges = await base44.entities.Badge.list();
    
    // Get user's earned badges
    const earnedBadges = await base44.entities.UserBadge.filter({ userId });
    const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badgeId));

    const newBadges = [];

    // Check each badge requirement
    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue; // Already earned

      let shouldAward = false;

      switch (badge.category) {
        case 'tasks':
          if ((appUser.tasksCompleted || 0) >= (badge.requirement || 1)) {
            shouldAward = true;
          }
          break;

        case 'vip':
          const vipLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
          if (vipLevels.indexOf(appUser.vipLevel) >= vipLevels.indexOf(badge.name.replace(' VIP', ''))) {
            shouldAward = true;
          }
          break;

        case 'streak':
          if ((appUser.currentStreak || 0) >= (badge.requirement || 1)) {
            shouldAward = true;
          }
          break;

        case 'earnings':
          if ((appUser.balance || 0) >= (badge.requirement || 1)) {
            shouldAward = true;
          }
          break;

        case 'special':
          // Top Referrer badge
          if (badge.name === 'Top Referrer' && (appUser.inviteCount || 0) >= 10) {
            shouldAward = true;
          }
          // Active User badge
          if (badge.name === 'Active User' && (appUser.currentStreak || 0) >= 7) {
            shouldAward = true;
          }
          break;
      }

      if (shouldAward) {
        await base44.entities.UserBadge.create({
          userId,
          badgeId: badge.id,
          earnedAt: new Date().toISOString()
        });
        newBadges.push(badge.name);

        // Award points for badge
        if (badge.points) {
          await base44.entities.AppUser.update(userId, {
            points: (appUser.points || 0) + badge.points
          });
        }
      }
    }

    return Response.json({ 
      success: true, 
      newBadges,
      message: `Awarded ${newBadges.length} badge(s)` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});