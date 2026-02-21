import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    let cleanedCount = 0;

    // Clean up expired task offers
    const expiredOffers = await base44.asServiceRole.entities.TaskOffer.filter({
      status: 'pending',
      expiresAt: { $lt: now.toISOString() }
    });

    for (const offer of expiredOffers) {
      await base44.asServiceRole.entities.TaskOffer.update(offer.id, {
        status: 'expired'
      });
      cleanedCount++;
    }

    // Clean up old pending UserTasks (older than 48 hours)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const oldPendingTasks = await base44.asServiceRole.entities.UserTask.filter({
      status: 'pending',
      created_date: { $lt: twoDaysAgo.toISOString() }
    });

    for (const task of oldPendingTasks) {
      await base44.asServiceRole.entities.UserTask.delete(task.id);
      cleanedCount++;
    }

    return Response.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired/old tasks`,
      expiredOffers: expiredOffers.length,
      oldPendingTasks: oldPendingTasks.length
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});