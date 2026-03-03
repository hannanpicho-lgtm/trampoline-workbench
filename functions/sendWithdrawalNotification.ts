import { getBase44Client } from './_shared/base44Client.ts';

/**
 * Sends notifications for withdrawal status changes
 * Called when withdrawal status is updated
 */
Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, payoutId, newStatus, amount, failureReason } = body;

    if (!userId || !newStatus) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ userId });
    const userPrefs = prefs.length > 0 ? prefs[0] : null;

    if (userPrefs?.withdrawalStatus === false) {
      return Response.json({ success: true, message: 'User opted out of withdrawal notifications' });
    }

    let title = '';
    let message = '';
    let priority = 'medium';

    switch (newStatus) {
      case 'approved':
        title = '✅ Withdrawal Approved';
        message = `Your withdrawal request of $${amount?.toFixed(2) || '0.00'} has been approved and will be processed soon.`;
        priority = 'high';
        break;

      case 'cancelled':
        title = '❌ Withdrawal Rejected';
        message = `Your withdrawal request of $${amount?.toFixed(2) || '0.00'} was rejected${failureReason ? `: ${failureReason}` : ''}. Funds have been returned to your account.`;
        priority = 'high';
        break;

      case 'processing':
        title = '⏳ Withdrawal Processing';
        message = `Your withdrawal of $${amount?.toFixed(2) || '0.00'} is now being processed. You'll receive it within 24-48 hours.`;
        priority = 'medium';
        break;

      case 'completed':
        title = '🎉 Withdrawal Complete';
        message = `Your withdrawal of $${amount?.toFixed(2) || '0.00'} has been successfully sent!`;
        priority = 'high';
        break;

      case 'failed':
        title = '⚠️ Withdrawal Failed';
        message = `Your withdrawal of $${amount?.toFixed(2) || '0.00'} failed${failureReason ? `: ${failureReason}` : ''}. Funds have been returned to your account.`;
        priority = 'high';
        break;

      default:
        return Response.json({ error: 'Unknown status' }, { status: 400 });
    }

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      userId,
      type: 'withdrawal_status',
      title,
      message,
      priority,
      read: false,
      relatedId: payoutId,
      relatedType: 'CommissionPayout'
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});