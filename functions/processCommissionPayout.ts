import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { payoutId, action, reason } = body;

    if (!payoutId || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the payout
    const payouts = await base44.asServiceRole.entities.CommissionPayout.filter({ id: payoutId });
    if (payouts.length === 0) {
      return Response.json({ error: 'Payout not found' }, { status: 404 });
    }

    const payout = payouts[0];
    const now = new Date().toISOString();
    const updateData = {};

    switch (action) {
      case 'approve':
        if (payout.status !== 'pending') {
          return Response.json({ error: 'Only pending payouts can be approved' }, { status: 400 });
        }
        updateData.status = 'approved';
        updateData.approvedAt = now;
        break;

      case 'reject':
        if (payout.status !== 'pending') {
          return Response.json({ error: 'Only pending payouts can be rejected' }, { status: 400 });
        }
        updateData.status = 'cancelled';
        updateData.failureReason = reason || 'Admin rejection';
        // Refund user balance
        const appUsers = await base44.asServiceRole.entities.AppUser.filter({ created_by: payout.userEmail });
        if (appUsers.length > 0) {
          const appUser = appUsers[0];
          await base44.asServiceRole.entities.AppUser.update(appUser.id, {
            balance: (appUser.balance || 0) + payout.amount
          });
        }
        break;

      case 'process':
        if (payout.status !== 'approved') {
          return Response.json({ error: 'Only approved payouts can be processed' }, { status: 400 });
        }
        updateData.status = 'processing';
        updateData.processedAt = now;
        // In production, integrate with payment gateway (Stripe, etc.)
        break;

      case 'complete':
        if (payout.status !== 'processing') {
          return Response.json({ error: 'Only processing payouts can be completed' }, { status: 400 });
        }
        updateData.status = 'completed';
        updateData.completedAt = now;
        break;

      case 'fail':
        if (payout.status !== 'processing') {
          return Response.json({ error: 'Only processing payouts can fail' }, { status: 400 });
        }
        updateData.status = 'failed';
        updateData.failureReason = reason || 'Payment processing failed';
        // Refund user balance
        const failUsers = await base44.asServiceRole.entities.AppUser.filter({ created_by: payout.userEmail });
        if (failUsers.length > 0) {
          const failUser = failUsers[0];
          await base44.asServiceRole.entities.AppUser.update(failUser.id, {
            balance: (failUser.balance || 0) + payout.amount
          });
        }
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update payout
    await base44.asServiceRole.entities.CommissionPayout.update(payoutId, updateData);

    return Response.json({ success: true, message: `Payout ${action}d successfully` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});